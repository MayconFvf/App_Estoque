import { supabase } from '../lib/supabaseClient'

const CUSTOMER_COLUMNS =
  'id, name, phone, email, notes, created_by, created_at, updated_at, created_by_profile:profiles!customers_created_by_fkey(name, email)'

function emptyToNull(value) {
  const trimmedValue = String(value ?? '').trim()
  return trimmedValue || null
}

function getCustomerErrorMessage(error) {
  return error?.message || 'Não foi possível salvar o cliente.'
}

export async function listCustomers(searchTerm = '') {
  const search = searchTerm.trim()
  let query = supabase
    .from('customers')
    .select(CUSTOMER_COLUMNS)
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getCustomerErrorMessage(error))
  }

  return data || []
}

export async function createCustomer(customer) {
  const payload = {
    name: customer.name.trim(),
    phone: emptyToNull(customer.phone),
    email: emptyToNull(customer.email),
    notes: emptyToNull(customer.notes),
  }

  const { data, error } = await supabase
    .from('customers')
    .insert(payload)
    .select(CUSTOMER_COLUMNS)
    .single()

  if (error) {
    throw new Error(getCustomerErrorMessage(error))
  }

  return data
}

export async function updateCustomer(customerId, customer) {
  const payload = {
    name: customer.name.trim(),
    phone: emptyToNull(customer.phone),
    email: emptyToNull(customer.email),
    notes: emptyToNull(customer.notes),
  }

  const { data, error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', customerId)
    .select(CUSTOMER_COLUMNS)
    .single()

  if (error) {
    throw new Error(getCustomerErrorMessage(error))
  }

  return data
}
