import { supabase } from '../lib/supabaseClient'

function getCurrentMonthRange() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

function getDashboardErrorMessage(error) {
  return error?.message || 'Não foi possível carregar o dashboard.'
}

export async function getDashboardData() {
  const { startDate, endDate } = getCurrentMonthRange()

  const productsQuery = supabase
    .from('products')
    .select('id, name, current_stock, minimum_stock, active')
    .eq('active', true)
    .order('name', { ascending: true })

  const customersQuery = supabase.from('customers').select('id')

  const salesQuery = supabase
    .from('sales')
    .select('id, total_amount')
    .eq('status', 'completed')
    .gte('sale_date', startDate)
    .lt('sale_date', endDate)

  const [productsResult, customersResult, salesResult] = await Promise.all([
    productsQuery,
    customersQuery,
    salesQuery,
  ])

  if (productsResult.error) {
    throw new Error(getDashboardErrorMessage(productsResult.error))
  }

  if (customersResult.error) {
    throw new Error(getDashboardErrorMessage(customersResult.error))
  }

  if (salesResult.error) {
    throw new Error(getDashboardErrorMessage(salesResult.error))
  }

  const activeProducts = productsResult.data || []
  const customers = customersResult.data || []
  const monthSales = salesResult.data || []
  const lowStockProducts = activeProducts.filter(
    (product) =>
      Number(product.current_stock) <= Number(product.minimum_stock),
  )
  const monthSalesAmount = monthSales.reduce(
    (total, sale) => total + Number(sale.total_amount || 0),
    0,
  )

  return {
    activeProductCount: activeProducts.length,
    customerCount: customers.length,
    monthSaleCount: monthSales.length,
    monthSalesAmount,
    lowStockProducts,
  }
}
