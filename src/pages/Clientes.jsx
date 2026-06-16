import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import { useAuth } from '../hooks/useAuth'
import {
  createCustomer,
  listCustomers,
  updateCustomer,
} from '../services/customerService'

const initialCustomerForm = {
  name: '',
  phone: '',
  email: '',
  notes: '',
}

function getCustomerForm(customer) {
  return {
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    notes: customer.notes || '',
  }
}

function validateCustomerForm(form) {
  if (!form.name.trim()) {
    return 'Nome do cliente é obrigatório.'
  }

  return ''
}

function Clientes() {
  const { profile } = useAuth()
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(initialCustomerForm)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const isAdmin = profile?.role === 'admin'

  async function loadCustomers() {
    setLoading(true)

    try {
      const data = await listCustomers(searchTerm)
      setCustomers(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    listCustomers()
      .then((data) => {
        if (isActive) {
          setCustomers(data)
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

  function handleNewCustomer() {
    setEditingCustomer(null)
    setForm(initialCustomerForm)
    setMessage(null)
    setShowForm(true)
  }

  function handleEditCustomer(customer) {
    setEditingCustomer(customer)
    setForm(getCustomerForm(customer))
    setMessage(null)
    setShowForm(true)
  }

  function handleCancelForm() {
    setEditingCustomer(null)
    setForm(initialCustomerForm)
    setShowForm(false)
  }

  async function handleSearch(event) {
    event.preventDefault()
    setMessage(null)
    await loadCustomers()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const validationMessage = validateCustomerForm(form)

    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSaving(true)

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form)
        setMessage({ type: 'success', text: 'Cliente atualizado com sucesso.' })
      } else {
        await createCustomer(form)
        setMessage({ type: 'success', text: 'Cliente cadastrado com sucesso.' })
      }

      setEditingCustomer(null)
      setForm(initialCustomerForm)
      setShowForm(false)
      await loadCustomers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Telefone', accessor: 'phone' },
    { header: 'E-mail', accessor: 'email' },
    {
      header: 'Observação',
      key: 'notes',
      render: (customer) => customer.notes || '-',
    },
    ...(isAdmin
      ? [
          {
            header: 'Responsável',
            key: 'created_by_profile',
            render: (customer) =>
              customer.created_by_profile?.name ||
              customer.created_by_profile?.email ||
              '-',
          },
        ]
      : []),
    {
      header: 'Ações',
      key: 'actions',
      render: (customer) => (
        <div className="table-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleEditCustomer(customer)}
            disabled={saving}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>
            {isAdmin
              ? 'Consulte todos os clientes e seus responsáveis.'
              : 'Cadastre e mantenha apenas os seus clientes.'}
          </p>
        </div>
        <Button type="button" onClick={handleNewCustomer}>
          Novo cliente
        </Button>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <Input
          label="Buscar por nome"
          name="customerSearch"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Digite o nome do cliente"
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
            <h2>{editingCustomer ? 'Editar cliente' : 'Novo cliente'}</h2>
          </div>

          <div className="form-grid">
            <Input
              label="Nome"
              name="customerName"
              value={form.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              required
            />
            <Input
              label="Telefone"
              name="customerPhone"
              value={form.phone}
              onChange={(event) => updateFormField('phone', event.target.value)}
            />
            <Input
              label="E-mail"
              name="customerEmail"
              type="email"
              value={form.email}
              onChange={(event) => updateFormField('email', event.target.value)}
            />
          </div>

          <label className="field">
            <span className="field__label">Observação</span>
            <textarea
              className="field__input field__textarea"
              name="customerNotes"
              value={form.notes}
              onChange={(event) => updateFormField('notes', event.target.value)}
              rows="4"
            />
          </label>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar cliente'}
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
        <div className="content-state">Carregando clientes...</div>
      ) : (
        <Table
          columns={columns}
          data={customers}
          emptyMessage="Nenhum cliente encontrado."
        />
      )}
    </section>
  )
}

export default Clientes
