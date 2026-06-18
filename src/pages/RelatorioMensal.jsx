import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Table from '../components/Table'
import { listCustomers } from '../services/customerService'
import { getMonthlySalesReport } from '../services/reportService'

const monthOptions = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function getDefaultReportFilters() {
  const currentDate = new Date()

  return {
    month: String(currentDate.getMonth() + 1),
    year: String(currentDate.getFullYear()),
    customerId: '',
    sortBy: 'quantity',
  }
}

function RelatorioMensal() {
  const defaultFilters = getDefaultReportFilters()
  const currentYear = new Date().getFullYear()
  const [month, setMonth] = useState(defaultFilters.month)
  const [year, setYear] = useState(defaultFilters.year)
  const [customerId, setCustomerId] = useState(defaultFilters.customerId)
  const [sortBy, setSortBy] = useState(defaultFilters.sortBy)
  const [customers, setCustomers] = useState([])
  const [report, setReport] = useState({
    rows: [],
    totals: {
      totalQuantity: 0,
      totalAmount: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const yearOptions = Array.from({ length: 6 }, (_, index) =>
    String(currentYear - index),
  )

  async function loadReport(nextFilters = { month, year, customerId, sortBy }) {
    setLoading(true)
    setMessage(null)

    try {
      const data = await getMonthlySalesReport(nextFilters)
      setReport(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([
      listCustomers(),
      getMonthlySalesReport(getDefaultReportFilters()),
    ])
      .then(([customerData, reportData]) => {
        if (isActive) {
          setCustomers(customerData)
          setReport(reportData)
        }
      })
      .catch((error) => {
        if (isActive) {
          setMessage({ type: 'error', text: error.message })
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    await loadReport({ month, year, customerId, sortBy })
  }

  const columns = [
    { header: 'Produto', accessor: 'productName' },
    { header: 'Quantidade vendida', accessor: 'totalQuantity' },
    {
      header: 'Valor total vendido',
      key: 'totalAmount',
      render: (row) => formatCurrency(row.totalAmount),
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Relatório mensal</h1>
          <p>Produtos vendidos no período selecionado.</p>
        </div>
      </div>

      <form className="toolbar toolbar--report" onSubmit={handleSubmit}>
        <label className="field" htmlFor="reportMonth">
          <span className="field__label">Mês</span>
          <select
            id="reportMonth"
            className="field__input"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="reportYear">
          <span className="field__label">Ano</span>
          <select
            id="reportYear"
            className="field__input"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="reportCustomer">
          <span className="field__label">Cliente</span>
          <select
            id="reportCustomer"
            className="field__input"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Todos os clientes</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="reportSort">
          <span className="field__label">Ordenar por</span>
          <select
            id="reportSort"
            className="field__input"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="quantity">Maior quantidade</option>
            <option value="amount">Maior valor</option>
          </select>
        </label>

        <Button type="submit" disabled={loading}>
          Buscar
        </Button>
      </form>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      <div className="summary-grid">
        <article className="metric-card">
          <span>Itens vendidos</span>
          <strong>{report.totals.totalQuantity}</strong>
        </article>
        <article className="metric-card">
          <span>Valor vendido</span>
          <strong>{formatCurrency(report.totals.totalAmount)}</strong>
        </article>
      </div>

      {loading ? (
        <div className="content-state">Carregando relatório...</div>
      ) : (
        <Table
          columns={columns}
          data={report.rows}
          emptyMessage="Nenhum produto vendido no período."
        />
      )}
    </section>
  )
}

export default RelatorioMensal
