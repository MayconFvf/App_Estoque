import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const allowedRoutesByRole = {
  admin: [
    '/dashboard',
    '/usuarios',
    '/produtos',
    '/clientes',
    '/entrada-estoque',
    '/vendas',
    '/estoque',
    '/relatorio-mensal',
  ],
  seller: ['/dashboard', '/clientes', '/vendas', '/estoque', '/relatorio-mensal'],
}

function isRouteAllowed(pathname, role) {
  const allowedRoutes = allowedRoutesByRole[role] || []

  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

function PrivateRoute() {
  const { loading, session, profile } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="loading-screen">Carregando...</div>
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isRouteAllowed(location.pathname, profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PrivateRoute
