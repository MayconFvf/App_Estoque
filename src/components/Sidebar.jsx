import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', roles: ['admin', 'seller'] },
  { label: 'Usuários', path: '/usuarios', roles: ['admin'] },
  { label: 'Produtos', path: '/produtos', roles: ['admin'] },
  { label: 'Clientes', path: '/clientes', roles: ['admin', 'seller'] },
  { label: 'Entrada de estoque', path: '/entrada-estoque', roles: ['admin'] },
  { label: 'Vendas', path: '/vendas', roles: ['admin', 'seller'] },
  { label: 'Estoque atual', path: '/estoque', roles: ['admin', 'seller'] },
  {
    label: 'Relatório mensal',
    path: '/relatorio-mensal',
    roles: ['admin', 'seller'],
  },
  { label: 'Ajuda', path: '/ajuda', roles: ['admin', 'seller'] },
]

function Sidebar({ isOpen = false, onClose }) {
  const { profile } = useAuth()
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(profile?.role),
  )

  return (
    <aside className={isOpen ? 'sidebar sidebar--open' : 'sidebar'}>
      <div className="sidebar__brand">
        <span className="sidebar-brand-logo" aria-hidden="true">
          <img src="/brand/Logo_Login1.png" alt="" />
        </span>
        <span className="sidebar-brand-text">
          <strong className="sidebar-brand-title">Rosa Fiore</strong>
          <small className="sidebar-brand-subtitle">Distribuidora</small>
        </span>
        <button
          type="button"
          className="sidebar__close"
          aria-label="Fechar menu"
          onClick={onClose}
        >
          X
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Menu principal">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
