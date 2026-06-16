import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../hooks/useAuth'
import {
  listActiveStockProducts,
  registerStockEntry,
} from '../services/inventoryService'

const initialStockEntryForm = {
  product_id: '',
  quantity: '',
  reason: '',
}

function validateStockEntryForm(form) {
  if (!form.product_id) {
    return 'Produto é obrigatório.'
  }

  if (String(form.quantity).trim() === '') {
    return 'Quantidade é obrigatória.'
  }

  if (Number(form.quantity) <= 0) {
    return 'Quantidade precisa ser maior que zero.'
  }

  return ''
}

function EntradaEstoque() {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialStockEntryForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function loadProducts() {
    setLoading(true)

    try {
      const data = await listActiveStockProducts()
      setProducts(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    listActiveStockProducts()
      .then((data) => {
        if (isActive) {
          setProducts(data)
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

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const validationMessage = validateStockEntryForm(form)

    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSaving(true)

    try {
      await registerStockEntry({
        productId: form.product_id,
        quantity: form.quantity,
        reason: form.reason,
        profileId: profile.id,
      })

      setForm(initialStockEntryForm)
      setMessage({
        type: 'success',
        text: 'Entrada de estoque registrada com sucesso.',
      })
      await loadProducts()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Entrada de estoque</h1>
          <p>Registre entradas manuais sem alterar o produto diretamente.</p>
        </div>
      </div>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-panel__header">
          <h2>Nova entrada</h2>
          <p>O estoque atual será atualizado automaticamente pelo banco.</p>
        </div>

        <div className="form-grid">
          <label className="field" htmlFor="stockEntryProduct">
            <span className="field__label">Produto ativo</span>
            <select
              id="stockEntryProduct"
              name="stockEntryProduct"
              className="field__input"
              value={form.product_id}
              onChange={(event) =>
                updateFormField('product_id', event.target.value)
              }
              disabled={loading || saving}
              required
            >
              <option value="">
                {loading ? 'Carregando produtos...' : 'Selecione um produto'}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Quantidade"
            name="stockEntryQuantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(event) => updateFormField('quantity', event.target.value)}
            disabled={saving}
            required
          />
        </div>

        <label className="field" htmlFor="stockEntryReason">
          <span className="field__label">Observação</span>
          <textarea
            id="stockEntryReason"
            name="stockEntryReason"
            className="field__input field__textarea"
            value={form.reason}
            onChange={(event) => updateFormField('reason', event.target.value)}
            rows="4"
            disabled={saving}
            placeholder="Entrada manual de estoque"
          />
        </label>

        <div className="form-actions">
          <Button type="submit" disabled={loading || saving}>
            {saving ? 'Registrando...' : 'Confirmar entrada'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default EntradaEstoque
