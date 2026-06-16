import { supabase } from '../lib/supabaseClient'

const STOCK_PRODUCT_COLUMNS =
  'id, name, brand, category, sku, sale_price, current_stock, minimum_stock, active'

function emptyToDefaultReason(value) {
  const trimmedValue = String(value ?? '').trim()
  return trimmedValue || 'Entrada manual de estoque'
}

function getInventoryErrorMessage(error) {
  const message = error?.message || ''

  if (message.includes('Estoque insuficiente')) {
    return message
  }

  if (message.includes('row-level security')) {
    return 'Você não tem permissão para registrar entrada de estoque.'
  }

  return message || 'Não foi possível atualizar o estoque.'
}

export async function listActiveStockProducts(searchTerm = '') {
  const search = searchTerm.trim()
  let query = supabase
    .from('products')
    .select(STOCK_PRODUCT_COLUMNS)
    .eq('active', true)
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getInventoryErrorMessage(error))
  }

  return data || []
}

export async function registerStockEntry({
  productId,
  quantity,
  reason,
  profileId,
}) {
  const parsedQuantity = Number(quantity)

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, active')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()

  if (productError) {
    throw new Error(getInventoryErrorMessage(productError))
  }

  if (!product) {
    throw new Error('Produto ativo não encontrado.')
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      product_id: productId,
      user_id: profileId,
      sale_id: null,
      movement_type: 'entry',
      quantity: parsedQuantity,
      reason: emptyToDefaultReason(reason),
    })
    .select('id, product_id, user_id, movement_type, quantity, reason, created_at')
    .single()

  if (error) {
    throw new Error(getInventoryErrorMessage(error))
  }

  return data
}
