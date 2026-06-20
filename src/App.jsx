import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Produtos from './pages/Produtos'
import Clientes from './pages/Clientes'
import EntradaEstoque from './pages/EntradaEstoque'
import Vendas from './pages/Vendas'
import Estoque from './pages/Estoque'
import RelatorioMensal from './pages/RelatorioMensal'
import Ajuda from './pages/Ajuda'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/entrada-estoque" element={<EntradaEstoque />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
            <Route path="/ajuda" element={<Ajuda />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
