import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDashboardData } from '../services/dashboardService'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  )
}

function Dashboard() {
  const { profile } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let isActive = true

    getDashboardData()
      .then((data) => {
        if (isActive) {
          setDashboard(data)
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

  const isAdmin = profile?.role === 'admin'

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {isAdmin
              ? 'Visão geral da operação neste mês.'
              : 'Resumo das suas vendas e atalhos principais.'}
          </p>
        </div>
      </div>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <div className="content-state">Carregando dashboard...</div>
      ) : (
        <>
          {isAdmin ? (
            <div className="summary-grid summary-grid--dashboard">
              <MetricCard
                label="Produtos ativos"
                value={dashboard?.activeProductCount || 0}
              />
              <MetricCard
                label="Clientes"
                value={dashboard?.customerCount || 0}
              />
              <MetricCard
                label="Vendas do mês"
                value={dashboard?.monthSaleCount || 0}
              />
              <MetricCard
                label="Valor vendido no mês"
                value={formatCurrency(dashboard?.monthSalesAmount)}
              />
              <MetricCard
                label="Produtos com estoque baixo"
                value={dashboard?.lowStockProducts.length || 0}
              />
            </div>
          ) : (
            <div className="summary-grid summary-grid--dashboard">
              <MetricCard
                label="Minhas vendas do mês"
                value={dashboard?.monthSaleCount || 0}
              />
              <MetricCard
                label="Meu valor vendido no mês"
                value={formatCurrency(dashboard?.monthSalesAmount)}
              />
              <MetricCard
                label="Clientes cadastrados"
                value={dashboard?.customerCount || 0}
              />
              <Link className="metric-card metric-card--link" to="/vendas">
                <span>Atalho</span>
                <strong>Nova venda</strong>
              </Link>
              <Link className="metric-card metric-card--link" to="/estoque">
                <span>Atalho</span>
                <strong>Estoque</strong>
              </Link>
            </div>
          )}

          {isAdmin && (
            <section className="page-section">
              <div className="section-header">
                <h2>Produtos com estoque baixo</h2>
              </div>

              {dashboard?.lowStockProducts.length ? (
                <div className="low-stock-list">
                  {dashboard.lowStockProducts.map((product) => (
                    <article key={product.id} className="low-stock-item">
                      <strong>{product.name}</strong>
                      <span>
                        Estoque atual: {product.current_stock} / mínimo:{' '}
                        {product.minimum_stock}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="content-state">
                  Nenhum produto com estoque baixo.
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  )
}

export default Dashboard
