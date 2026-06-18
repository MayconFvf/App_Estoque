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

function MetricCard({ label, value, helper, icon, to }) {
  const content = (
    <>
      <div className="metric-card__top">
        <span>{label}</span>
        {icon && (
          <span className="metric-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </>
  )

  if (to) {
    return (
      <Link className="metric-card metric-card--link" to={to}>
        {content}
      </Link>
    )
  }

  return <article className="metric-card">{content}</article>
}

function DashboardSection({ eyebrow, title, children }) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function QuickLink({ to, label, helper }) {
  return (
    <Link className="quick-link" to={to}>
      <strong>{label}</strong>
      {helper && <span>{helper}</span>}
    </Link>
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

  const adminMetrics = [
    {
      label: 'Produtos ativos',
      value: dashboard?.activeProductCount || 0,
      helper: 'Itens disponíveis para venda',
      icon: 'P',
    },
    {
      label: 'Clientes',
      value: dashboard?.customerCount || 0,
      helper: 'Base cadastrada',
      icon: 'C',
    },
    {
      label: 'Vendas do mês',
      value: dashboard?.monthSaleCount || 0,
      helper: 'Vendas concluídas',
      icon: 'V',
    },
    {
      label: 'Valor vendido no mês',
      value: formatCurrency(dashboard?.monthSalesAmount),
      helper: 'Receita do período',
      icon: '$',
    },
    {
      label: 'Estoque baixo',
      value: dashboard?.lowStockProducts.length || 0,
      helper: 'Produtos pedindo atenção',
      icon: '!',
    },
  ]

  const sellerMetrics = [
    {
      label: 'Minhas vendas do mês',
      value: dashboard?.monthSaleCount || 0,
      helper: 'Vendas concluídas',
      icon: 'V',
    },
    {
      label: 'Meu valor vendido no mês',
      value: formatCurrency(dashboard?.monthSalesAmount),
      helper: 'Total das suas vendas',
      icon: '$',
    },
    {
      label: 'Clientes cadastrados',
      value: dashboard?.customerCount || 0,
      helper: 'Clientes vinculados a você',
      icon: 'C',
    },
    {
      label: 'Atalho',
      value: 'Nova venda',
      helper: 'Registrar venda',
      icon: '+',
      to: '/vendas',
    },
    {
      label: 'Atalho',
      value: 'Estoque',
      helper: 'Consultar produtos',
      icon: 'E',
      to: '/estoque',
    },
  ]

  const quickLinks = isAdmin
    ? [
        { to: '/produtos', label: 'Novo produto', helper: 'Gerenciar catálogo' },
        { to: '/clientes', label: 'Novo cliente', helper: 'Cadastrar cliente' },
        {
          to: '/entrada-estoque',
          label: 'Entrada de estoque',
          helper: 'Adicionar quantidade',
        },
        {
          to: '/relatorio-mensal',
          label: 'Relatório mensal',
          helper: 'Ver desempenho',
        },
        { to: '/usuarios', label: 'Usuários', helper: 'Gerenciar acessos' },
      ]
    : [
        { to: '/vendas', label: 'Nova venda', helper: 'Registrar atendimento' },
        { to: '/estoque', label: 'Estoque', helper: 'Consultar disponibilidade' },
        { to: '/clientes', label: 'Clientes', helper: 'Cadastrar e editar' },
      ]

  const metrics = isAdmin ? adminMetrics : sellerMetrics

  return (
    <section className="page dashboard-page">
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
        <div className="dashboard-content">
          <DashboardSection eyebrow="Resumo" title="Resumo do mês">
            <div className="summary-grid summary-grid--dashboard">
              {metrics.map((metric) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                  icon={metric.icon}
                  to={metric.to}
                />
              ))}
            </div>
          </DashboardSection>

          {isAdmin && (
            <DashboardSection eyebrow="Atenção" title="Produtos com estoque baixo">
              {dashboard?.lowStockProducts.length ? (
                <div className="low-stock-list">
                  {dashboard.lowStockProducts.map((product) => (
                    <article key={product.id} className="low-stock-item">
                      <div className="low-stock-item__header">
                        <strong>{product.name}</strong>
                        <span className="status status--low">Estoque baixo</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Atual</dt>
                          <dd>{product.current_stock}</dd>
                        </div>
                        <div>
                          <dt>Mínimo</dt>
                          <dd>{product.minimum_stock}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="content-state">
                  Nenhum produto com estoque baixo.
                </div>
              )}
            </DashboardSection>
          )}

          <DashboardSection eyebrow="Atalhos" title="Atalhos rápidos">
            <div className="quick-links-grid">
              {quickLinks.map((link) => (
                <QuickLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  helper={link.helper}
                />
              ))}
            </div>
          </DashboardSection>
        </div>
      )}
    </section>
  )
}

export default Dashboard
