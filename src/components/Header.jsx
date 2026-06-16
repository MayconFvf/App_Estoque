import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from './Button'

function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div className="header__title">
        <button
          type="button"
          className="header__menu-button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          ☰
        </button>
        <div>
          <p className="header__eyebrow">Sistema web</p>
          <h2>Gestão de estoque</h2>
        </div>
      </div>

      <div className="header__actions">
        <div className="header__user">
          <strong>{profile?.name || 'Usuário'}</strong>
          <span>{profile?.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
        </div>
        <Button type="button" variant="secondary" onClick={handleSignOut}>
          Sair
        </Button>
      </div>
    </header>
  )
}

export default Header
