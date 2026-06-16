import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import {
  createUser,
  listUsers,
  setUserActive,
  updateUser,
} from '../services/userService'

const initialUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'seller',
  active: true,
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

function Usuarios() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(initialUserForm)
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

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

  function updateFormField(field, value) {
    setForm((currentForm) => ({
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
      render: (user) => (
        <div className="table-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleEditUser(user)}
            disabled={saving}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleToggleActive(user)}
            disabled={saving}
          >
            {user.active ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Cadastre usuários e controle o perfil de acesso.</p>
        </div>
        <Button type="button" onClick={handleNewUser}>
          Novo usuário
        </Button>
      </div>

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

      {loading ? (
        <div className="content-state">Carregando usuários...</div>
      ) : (
        <Table
          columns={columns}
          data={users}
          emptyMessage="Nenhum usuário encontrado."
        />
      )}
    </section>
  )
}

export default Usuarios
