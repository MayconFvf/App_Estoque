import { supabase } from '../lib/supabaseClient'

const SALE_COLUMNS = `
  id,
  sale_date,
  total_amount,
  status,
  customer:customers(name),
  seller:profiles(name)
`

function getSaleErrorMessage(error) {
  const message = error?.message || ''

  if (message.includes('Estoque insuficiente')) {
    return 'Estoque insuficiente para este produto.'
  }

  if (message.includes('cliente de outro vendedor')) {
    return 'Você não pode registrar venda para cliente de outro vendedor.'
  }

  if (message.includes('Cliente é obrigatório')) {
    return 'Cliente é obrigatório para registrar venda.'
  }

  if (message.includes('Produto inativo')) {
    return 'Produto inativo não pode ser vendido.'
  }

  if (message.includes('Usuário sem perfil ativo')) {
    return 'Usuário sem perfil ativo.'
  }

  return message || 'Não foi possível registrar a venda.'
}

export async function registerSale({ customerId, items }) {
  const payloadItems = items.map((item) => ({
    product_id: item.product_id,
    quantity: Number(item.quantity),
  }))

  const { data, error } = await supabase.rpc('register_sale', {
    p_customer_id: customerId,
    p_items: payloadItems,
  })

  if (error) {
    throw new Error(getSaleErrorMessage(error))
  }

  return data
}

export async function listSales() {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_COLUMNS)
    .order('sale_date', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(getSaleErrorMessage(error))
  }

  return data || []
}
