import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  function openSidebar() {
    setIsSidebarOpen(true)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className={isSidebarOpen ? 'app-shell app-shell--menu-open' : 'app-shell'}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="app-content">
        <Header onMenuClick={openSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Fechar menu"
        onClick={closeSidebar}
      />
    </div>
  )
}

export default MainLayout
