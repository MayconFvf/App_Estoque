import { supabase } from '../lib/supabaseClient'

const PRODUCT_COLUMNS =
  'id, name, brand, category, sku, sale_price, current_stock, minimum_stock, active, created_at, updated_at'

function emptyToNull(value) {
  const trimmedValue = String(value ?? '').trim()
  return trimmedValue || null
}

function getProductErrorMessage(error) {
  const message = error?.message || ''

  if (error?.code === '23505' && message.toLowerCase().includes('sku')) {
    return 'Já existe um produto com este SKU.'
  }

  if (message.includes('current_stock não pode ser alterado diretamente')) {
    return 'O estoque do produto não pode ser alterado nesta tela.'
  }

  return message || 'Não foi possível salvar o produto.'
}

export async function listProducts(searchTerm = '') {
  const search = searchTerm.trim()
  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getProductErrorMessage(error))
  }

  return data || []
}

export async function createProduct(product) {
  const payload = {
    name: product.name.trim(),
    brand: emptyToNull(product.brand),
    category: emptyToNull(product.category),
    sku: emptyToNull(product.sku),
    sale_price: Number(product.sale_price),
    current_stock: 0,
    minimum_stock: Number(product.minimum_stock || 0),
    active: Boolean(product.active),
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(PRODUCT_COLUMNS)
    .single()

  if (error) {
    throw new Error(getProductErrorMessage(error))
  }

  return data
}

export async function updateProduct(productId, product) {
  const payload = {
    name: product.name.trim(),
    brand: emptyToNull(product.brand),
    category: emptyToNull(product.category),
    sku: emptyToNull(product.sku),
    sale_price: Number(product.sale_price),
    minimum_stock: Number(product.minimum_stock || 0),
    active: Boolean(product.active),
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select(PRODUCT_COLUMNS)
    .single()

  if (error) {
    throw new Error(getProductErrorMessage(error))
  }

  return data
}

export async function setProductActive(productId, active) {
  const { data, error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', productId)
    .select(PRODUCT_COLUMNS)
    .single()

  if (error) {
    throw new Error(getProductErrorMessage(error))
  }

  return data
}
