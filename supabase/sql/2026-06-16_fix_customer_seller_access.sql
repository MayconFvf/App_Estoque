begin;

drop policy if exists customers_select_authenticated on public.customers;
drop policy if exists customers_select_admin on public.customers;
drop policy if exists customers_select_own_seller on public.customers;
drop policy if exists customers_insert_authenticated on public.customers;
drop policy if exists customers_update_admin_or_owner on public.customers;

create policy customers_select_admin
on public.customers
for select to authenticated
using (public.is_admin());

create policy customers_select_own_seller
on public.customers
for select to authenticated
using (
  public.is_seller()
  and created_by = public.get_current_profile_id()
);

create policy customers_insert_authenticated
on public.customers
for insert to authenticated
with check (
  public.get_current_profile_id() is not null
  and created_by = public.get_current_profile_id()
);

create policy customers_update_admin_or_owner
on public.customers
for update to authenticated
using (
  public.is_admin()
  or (
    public.is_seller()
    and created_by = public.get_current_profile_id()
  )
)
with check (
  public.is_admin()
  or (
    public.is_seller()
    and created_by = public.get_current_profile_id()
  )
);

create or replace function public.register_sale(
  p_customer_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_role text;
  v_customer_created_by uuid;
  v_sale_id uuid;
  v_total numeric(10,2) := 0;
  v_item record;
  v_product record;
  v_subtotal numeric(10,2);
begin
  v_profile_id = public.get_current_profile_id();
  v_role = public.get_current_user_role();

  if v_profile_id is null then
    raise exception 'Usuário sem perfil ativo.';
  end if;

  if v_role not in ('admin', 'seller') then
    raise exception 'Perfil sem permissão para registrar venda.';
  end if;

  if p_customer_id is null then
    raise exception 'Cliente é obrigatório para registrar venda.';
  end if;

  select c.created_by
  into v_customer_created_by
  from public.customers c
  where c.id = p_customer_id;

  if not found then
    raise exception 'Cliente não encontrado.';
  end if;

  if v_role = 'seller' and v_customer_created_by <> v_profile_id then
    raise exception 'Você não pode registrar venda para cliente de outro vendedor.';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa ter pelo menos um item.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    where item.product_id is null
       or item.quantity is null
       or item.quantity <= 0
  ) then
    raise exception 'Item de venda inválido.';
  end if;

  insert into public.sales (customer_id, seller_id, total_amount, status)
  values (p_customer_id, v_profile_id, 0, 'completed')
  returning id into v_sale_id;

  for v_item in
    select
      item.product_id,
      sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by item.product_id
    order by item.product_id
  loop
    select p.id, p.sale_price, p.current_stock, p.active
    into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if not found then
      raise exception 'Produto não encontrado: %.', v_item.product_id;
    end if;

    if not v_product.active then
      raise exception 'Produto inativo não pode ser vendido: %.', v_item.product_id;
    end if;

    if v_product.current_stock < v_item.quantity then
      raise exception 'Estoque insuficiente para o produto %. Disponível: %, solicitado: %.',
        v_item.product_id, v_product.current_stock, v_item.quantity;
    end if;

    v_subtotal = (v_item.quantity * v_product.sale_price)::numeric(10,2);
    v_total = (v_total + v_subtotal)::numeric(10,2);

    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      subtotal
    )
    values (
      v_sale_id,
      v_item.product_id,
      v_item.quantity,
      v_product.sale_price,
      v_subtotal
    );

    insert into public.stock_movements (
      product_id,
      user_id,
      sale_id,
      movement_type,
      quantity,
      reason
    )
    values (
      v_item.product_id,
      v_profile_id,
      v_sale_id,
      'sale',
      -v_item.quantity,
      'Saída por venda'
    );
  end loop;

  update public.sales
  set total_amount = v_total
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

grant execute on function public.register_sale(uuid, jsonb) to authenticated;

commit;
