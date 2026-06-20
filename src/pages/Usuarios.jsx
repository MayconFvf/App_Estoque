import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import {
  createUser,
  listUsers,
  setUserActive,
  updateUser,
  updateUserPassword,
} from '../services/userService'

const initialUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'seller',
  active: true,
}

const initialPasswordForm = {
  password: '',
  confirmPassword: '',
}

function getRoleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Vendedor'
}

function getUserForm(user) {
  return {
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'seller',
    active: Boolean(user.active),
  }
}

function validateUserForm(form, isEditing) {
  if (!form.name.trim()) {
    return 'Nome é obrigatório.'
  }

  if (!isEditing && !form.email.trim()) {
    return 'E-mail é obrigatório.'
  }

  if (!isEditing && !form.password) {
    return 'Senha é obrigatória.'
  }

  if (!isEditing && form.password.length < 6) {
    return 'Senha precisa ter no mínimo 6 caracteres.'
  }

  if (!['admin', 'seller'].includes(form.role)) {
    return 'Perfil inválido.'
  }

  return ''
}

function validatePasswordForm(form) {
  if (!form.password || !form.confirmPassword) {
    return 'Preencha a nova senha e a confirmação.'
  }

  if (form.password.length < 6) {
    return 'A nova senha precisa ter pelo menos 6 caracteres.'
  }

  if (form.password !== form.confirmPassword) {
    return 'A confirmação da senha não confere.'
  }

  return ''
}

function Usuarios() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(initialUserForm)
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)
  const [passwordUser, setPasswordUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const actionMenuRef = useRef(null)

  async function loadUsers() {
    setLoading(true)

    try {
      const data = await listUsers(searchTerm)
      setUsers(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    listUsers()
      .then((data) => {
        if (isActive) {
          setUsers(data)
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

  useEffect(() => {
    if (!openActionMenuId) {
      return undefined
    }

    function handlePointerDown(event) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setOpenActionMenuId(null)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openActionMenuId])

  function updateFormField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function updatePasswordFormField(field, value) {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function handleNewUser() {
    setEditingUser(null)
    setForm(initialUserForm)
    setMessage(null)
    setShowForm(true)
  }

  function handleEditUser(user) {
    setOpenActionMenuId(null)
    setEditingUser(user)
    setForm(getUserForm(user))
    setMessage(null)
    setShowForm(true)
  }

  function handleCancelForm() {
    setEditingUser(null)
    setForm(initialUserForm)
    setShowForm(false)
  }

  async function handleSearch(event) {
    event.preventDefault()
    setMessage(null)
    await loadUsers()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const validationMessage = validateUserForm(form, Boolean(editingUser))

    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSaving(true)

    try {
      if (editingUser) {
        await updateUser(editingUser.id, form)
        setMessage({ type: 'success', text: 'Usuário atualizado com sucesso.' })
      } else {
        await createUser(form)
        setMessage({ type: 'success', text: 'Usuário criado com sucesso.' })
      }

      setEditingUser(null)
      setForm(initialUserForm)
      setShowForm(false)
      await loadUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(user) {
    const confirmationMessage = user.active
      ? 'Tem certeza que deseja desativar este usuário? Ele não poderá acessar o sistema.'
      : 'Tem certeza que deseja ativar este usuário?'

    if (!window.confirm(confirmationMessage)) {
      setOpenActionMenuId(null)
      return
    }

    setOpenActionMenuId(null)
    setSaving(true)
    setMessage(null)

    try {
      await setUserActive(user.id, !user.active)
      setMessage({
        type: 'success',
        text: user.active
          ? 'Usuário desativado com sucesso.'
          : 'Usuário ativado com sucesso.',
      })
      await loadUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  function handleOpenPasswordModal(user) {
    setOpenActionMenuId(null)
    setPasswordUser(user)
    setPasswordForm(initialPasswordForm)
    setPasswordMessage(null)
    setMessage(null)
  }

  function handleCancelPasswordModal() {
    setPasswordUser(null)
    setPasswordForm(initialPasswordForm)
    setPasswordMessage(null)
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordMessage(null)

    const validationMessage = validatePasswordForm(passwordForm)

    if (validationMessage) {
      setPasswordMessage({ type: 'error', text: validationMessage })
      return
    }

    if (!passwordUser?.auth_user_id) {
      setPasswordMessage({
        type: 'error',
        text: 'Usuário sem vínculo com Supabase Auth.',
      })
      return
    }

    setPasswordSaving(true)

    try {
      const data = await updateUserPassword({
        authUserId: passwordUser.auth_user_id,
        password: passwordForm.password,
      })

      setMessage({
        type: 'success',
        text: data?.message || 'Senha atualizada com sucesso.',
      })
      handleCancelPasswordModal()
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } finally {
      setPasswordSaving(false)
    }
  }

  function getActionMenuId(user, scope) {
    return `${scope}-${user.id}`
  }

  function toggleActionMenu(user, scope) {
    const menuId = getActionMenuId(user, scope)
    setOpenActionMenuId((currentId) => (currentId === menuId ? null : menuId))
  }

  function renderActionMenu(user, scope) {
    const menuId = getActionMenuId(user, scope)
    const isOpen = openActionMenuId === menuId

    return (
      <div
        className="user-actions-menu"
        ref={isOpen ? actionMenuRef : null}
      >
        <button
          type="button"
          className="user-actions-menu__trigger"
          aria-label={`Abrir ações de ${user.name}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => toggleActionMenu(user, scope)}
          disabled={saving || passwordSaving}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="user-actions-menu__dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => handleEditUser(user)}
            >
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleOpenPasswordModal(user)}
            >
              Trocar senha
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleToggleActive(user)}
              disabled={saving}
            >
              {user.active ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'E-mail', accessor: 'email' },
    {
      header: 'Perfil',
      key: 'role',
      render: (user) => getRoleLabel(user.role),
    },
    {
      header: 'Status',
      key: 'active',
      render: (user) => (
        <span className={user.active ? 'status status--active' : 'status'}>
          {user.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Ações',
      key: 'actions',
      render: (user) => renderActionMenu(user, 'desktop'),
    },
  ]

  return (
    <section className="page users-page">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Cadastre usuários e controle o perfil de acesso.</p>
        </div>
        <Button type="button" onClick={handleNewUser}>
          Novo usuário
        </Button>
      </div>

      <p className="tip-box">
        Dica: cadastre vendedores para que cada um acesse apenas seus próprios
        clientes e vendas.
      </p>

      <form className="toolbar" onSubmit={handleSearch}>
        <Input
          label="Buscar por nome ou e-mail"
          name="userSearch"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Digite nome ou e-mail"
        />
        <Button type="submit" disabled={loading}>
          Buscar
        </Button>
      </form>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="form-panel__header">
            <h2>{editingUser ? 'Editar usuário' : 'Novo usuário'}</h2>
            <p>
              {editingUser
                ? 'Altere nome, perfil e status do usuário.'
                : 'O usuário será criado no Supabase Auth pela Edge Function.'}
            </p>
          </div>

          <div className="form-grid">
            <Input
              label="Nome"
              name="userName"
              value={form.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              required
            />

            <Input
              label="E-mail"
              name="userEmail"
              type="email"
              value={form.email}
              onChange={(event) => updateFormField('email', event.target.value)}
              disabled={Boolean(editingUser)}
              required={!editingUser}
            />

            {!editingUser && (
              <Input
                label="Senha"
                name="userPassword"
                type="password"
                minLength="6"
                value={form.password}
                onChange={(event) =>
                  updateFormField('password', event.target.value)
                }
                required
              />
            )}

            <label className="field" htmlFor="userRole">
              <span className="field__label">Perfil</span>
              <select
                id="userRole"
                name="userRole"
                className="field__input"
                value={form.role}
                onChange={(event) => updateFormField('role', event.target.value)}
                required
              >
                <option value="seller">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>

          {editingUser && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateFormField('active', event.target.checked)
                }
              />
              Usuário ativo
            </label>
          )}

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar usuário'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelForm}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {passwordUser && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!passwordSaving) {
              handleCancelPasswordModal()
            }
          }}
        >
          <form
            className="modal-panel password-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="passwordModalTitle"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <div className="modal-panel__header">
              <div>
                <h2 id="passwordModalTitle">Trocar senha</h2>
                <p>Atualize a senha de acesso do usuário selecionado.</p>
              </div>
            </div>

            <div className="password-modal__user">
              <strong>{passwordUser.name}</strong>
              <span>{passwordUser.email}</span>
            </div>

            {passwordMessage && (
              <p className={`form-message form-message--${passwordMessage.type}`}>
                {passwordMessage.text}
              </p>
            )}

            <div className="form-grid form-grid--single">
              <Input
                label="Nova senha"
                name="newUserPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.password}
                onChange={(event) =>
                  updatePasswordFormField('password', event.target.value)
                }
              />
              <Input
                label="Confirmar nova senha"
                name="confirmUserPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  updatePasswordFormField('confirmPassword', event.target.value)
                }
              />
            </div>

            <div className="form-actions">
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Salvando...' : 'Salvar senha'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelPasswordModal}
                disabled={passwordSaving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="content-state">Carregando usuários...</div>
      ) : (
        <>
          <div className="users-desktop-table">
            <Table
              columns={columns}
              data={users}
              emptyMessage="Nenhum usuário encontrado."
            />
          </div>

          <div className="users-mobile-list">
            {users.length ? (
              users.map((user) => (
                <article key={user.id} className="user-mobile-card">
                  <div className="user-mobile-card-header">
                    <div className="user-mobile-main">
                      <strong className="user-mobile-name">{user.name}</strong>
                      <span className="user-mobile-email">{user.email}</span>
                    </div>

                    <div className="user-mobile-actions">
                      {renderActionMenu(user, 'mobile')}
                    </div>
                  </div>

                  <div className="user-mobile-details">
                    <div>
                      <span>Perfil:</span> {getRoleLabel(user.role)}
                    </div>
                    <div>
                      <span>Status:</span>{' '}
                      <span
                        className={
                          user.active ? 'status status--active' : 'status'
                        }
                      >
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="content-state">Nenhum usuário encontrado.</div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default Usuarios
