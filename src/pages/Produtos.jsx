import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import {
  createProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from '../services/productService'

const initialProductForm = {
  name: '',
  brand: '',
  category: '',
  sku: '',
  sale_price: '',
  minimum_stock: '0',
  active: true,
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function getProductForm(product) {
  return {
    name: product.name || '',
    brand: product.brand || '',
    category: product.category || '',
    sku: product.sku || '',
    sale_price: product.sale_price ?? '',
    minimum_stock: product.minimum_stock ?? '0',
    active: Boolean(product.active),
  }
}

function validateProductForm(form) {
  if (!form.name.trim()) {
    return 'Nome do produto é obrigatório.'
  }

  if (String(form.sale_price).trim() === '') {
    return 'Preço de venda é obrigatório.'
  }

  if (Number(form.sale_price) < 0) {
    return 'Preço de venda precisa ser maior ou igual a zero.'
  }

  if (Number(form.minimum_stock || 0) < 0) {
    return 'Estoque mínimo precisa ser maior ou igual a zero.'
  }

  return ''
}

function Produtos() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(initialProductForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function loadProducts() {
    setLoading(true)

    try {
      const data = await listProducts(searchTerm)
      setProducts(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    listProducts()
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

  function handleNewProduct() {
    setEditingProduct(null)
    setForm(initialProductForm)
    setMessage(null)
    setShowForm(true)
  }

  function handleEditProduct(product) {
    setEditingProduct(product)
    setForm(getProductForm(product))
    setMessage(null)
    setShowForm(true)
  }

  function handleCancelForm() {
    setEditingProduct(null)
    setForm(initialProductForm)
    setShowForm(false)
  }

  async function handleSearch(event) {
    event.preventDefault()
    setMessage(null)
    await loadProducts()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const validationMessage = validateProductForm(form)

    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSaving(true)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form)
        setMessage({ type: 'success', text: 'Produto atualizado com sucesso.' })
      } else {
        await createProduct(form)
        setMessage({ type: 'success', text: 'Produto cadastrado com sucesso.' })
      }

      setEditingProduct(null)
      setForm(initialProductForm)
      setShowForm(false)
      await loadProducts()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(product) {
    setSaving(true)
    setMessage(null)

    try {
      await setProductActive(product.id, !product.active)
      setMessage({
        type: 'success',
        text: product.active
          ? 'Produto desativado com sucesso.'
          : 'Produto ativado com sucesso.',
      })
      await loadProducts()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Marca', accessor: 'brand' },
    { header: 'Categoria', accessor: 'category' },
    { header: 'SKU', accessor: 'sku' },
    {
      header: 'Preço',
      key: 'sale_price',
      render: (product) => formatCurrency(product.sale_price),
    },
    { header: 'Estoque atual', accessor: 'current_stock' },
    { header: 'Estoque mínimo', accessor: 'minimum_stock' },
    {
      header: 'Status',
      key: 'active',
      render: (product) => (
        <span className={product.active ? 'status status--active' : 'status'}>
          {product.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Ações',
      key: 'actions',
      render: (product) => (
        <div className="table-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleEditProduct(product)}
            disabled={saving}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleToggleActive(product)}
            disabled={saving}
          >
            {product.active ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Produtos</h1>
          <p>Cadastre produtos sem alterar o estoque diretamente.</p>
        </div>
        <Button type="button" onClick={handleNewProduct}>
          Novo produto
        </Button>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <Input
          label="Buscar por nome"
          name="productSearch"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Digite o nome do produto"
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
            <h2>{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
            <p>O estoque atual não é alterado por este cadastro.</p>
          </div>

          <div className="form-grid">
            <Input
              label="Nome"
              name="productName"
              value={form.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              required
            />
            <Input
              label="Marca"
              name="productBrand"
              value={form.brand}
              onChange={(event) => updateFormField('brand', event.target.value)}
            />
            <Input
              label="Categoria"
              name="productCategory"
              value={form.category}
              onChange={(event) =>
                updateFormField('category', event.target.value)
              }
            />
            <Input
              label="SKU"
              name="productSku"
              value={form.sku}
              onChange={(event) => updateFormField('sku', event.target.value)}
            />
            <Input
              label="Preço de venda"
              name="productSalePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.sale_price}
              onChange={(event) =>
                updateFormField('sale_price', event.target.value)
              }
              required
            />
            <Input
              label="Estoque mínimo"
              name="productMinimumStock"
              type="number"
              min="0"
              step="1"
              value={form.minimum_stock}
              onChange={(event) =>
                updateFormField('minimum_stock', event.target.value)
              }
            />
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                updateFormField('active', event.target.checked)
              }
            />
            Produto ativo
          </label>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar produto'}
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
        <div className="content-state">Carregando produtos...</div>
      ) : (
        <Table
          columns={columns}
          data={products}
          emptyMessage="Nenhum produto encontrado."
        />
      )}
    </section>
  )
}

export default Produtos
