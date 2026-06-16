import { supabase } from '../lib/supabaseClient'

function getMonthRange({ month, year }) {
  const monthIndex = Number(month) - 1
  const selectedYear = Number(year)
  const startDate = new Date(selectedYear, monthIndex, 1, 0, 0, 0)
  const endDate = new Date(selectedYear, monthIndex + 1, 1, 0, 0, 0)

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

function getReportErrorMessage(error) {
  return error?.message || 'Não foi possível carregar o relatório.'
}

export async function getMonthlySalesReport({ month, year, sortBy = 'quantity' }) {
  const { startDate, endDate } = getMonthRange({ month, year })

  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id')
    .eq('status', 'completed')
    .gte('sale_date', startDate)
    .lt('sale_date', endDate)

  if (salesError) {
    throw new Error(getReportErrorMessage(salesError))
  }

  if (!sales?.length) {
    return {
      rows: [],
      totals: {
        totalQuantity: 0,
        totalAmount: 0,
      },
    }
  }

  const saleIds = sales.map((sale) => sale.id)
  const { data: items, error: itemsError } = await supabase
    .from('sale_items')
    .select('product_id, quantity, subtotal, product:products(name)')
    .in('sale_id', saleIds)

  if (itemsError) {
    throw new Error(getReportErrorMessage(itemsError))
  }

  const groupedItems = (items || []).reduce((groups, item) => {
    const productId = item.product_id
    const currentGroup = groups.get(productId) || {
      productId,
      productName: item.product?.name || 'Produto não encontrado',
      totalQuantity: 0,
      totalAmount: 0,
    }

    currentGroup.totalQuantity += Number(item.quantity || 0)
    currentGroup.totalAmount += Number(item.subtotal || 0)
    groups.set(productId, currentGroup)

    return groups
  }, new Map())

  const rows = Array.from(groupedItems.values()).sort((a, b) => {
    if (sortBy === 'amount') {
      return b.totalAmount - a.totalAmount
    }

    return b.totalQuantity - a.totalQuantity
  })

  const totals = rows.reduce(
    (summary, row) => ({
      totalQuantity: summary.totalQuantity + row.totalQuantity,
      totalAmount: summary.totalAmount + row.totalAmount,
    }),
    { totalQuantity: 0, totalAmount: 0 },
  )

  return { rows, totals }
}
