import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import { listCustomers } from '../services/customerService'
import { listActiveStockProducts } from '../services/inventoryService'
import { listSales, registerSale } from '../services/saleService'

const initialSaleForm = {
  customer_id: '',
  product_id: '',
  quantity: '',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusLabel(status) {
  if (status === 'completed') {
    return 'Concluída'
  }

  if (status === 'cancelled') {
    return 'Cancelada'
  }

  return status || '-'
}

function Vendas() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [form, setForm] = useState(initialSaleForm)
  const [saleItems, setSaleItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function refreshSaleData() {
    setLoading(true)

    try {
      const [customerData, productData, saleData] = await Promise.all([
        listCustomers(),
        listActiveStockProducts(),
        listSales(),
      ])

      setCustomers(customerData)
      setProducts(productData)
      setSales(saleData)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([listCustomers(), listActiveStockProducts(), listSales()])
      .then(([customerData, productData, saleData]) => {
        if (isActive) {
          setCustomers(customerData)
          setProducts(productData)
          setSales(saleData)
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

  function getSelectedProduct() {
    return products.find((product) => product.id === form.product_id)
  }

  function handleAddItem(event) {
    event.preventDefault()
    setMessage(null)

    const selectedProduct = getSelectedProduct()
    const quantity = Number(form.quantity)

    if (!form.product_id || !selectedProduct) {
      setMessage({ type: 'error', text: 'Produto é obrigatório.' })
      return
    }

    if (Number(selectedProduct.current_stock) <= 0) {
      setMessage({
        type: 'error',
        text: 'Não é possível vender produto com estoque zerado.',
      })
      return
    }

    if (!form.quantity || quantity <= 0) {
      setMessage({
        type: 'error',
        text: 'Quantidade precisa ser maior que zero.',
      })
      return
    }

    const existingItem = saleItems.find(
      (item) => item.product_id === selectedProduct.id,
    )
    const nextQuantity = (existingItem?.quantity || 0) + quantity

    if (nextQuantity > Number(selectedProduct.current_stock)) {
      setMessage({
        type: 'error',
        text: 'Estoque insuficiente para este produto.',
      })
      return
    }

    if (existingItem) {
      setSaleItems((currentItems) =>
        currentItems.map((item) =>
          item.product_id === selectedProduct.id
            ? { ...item, quantity: nextQuantity }
            : item,
        ),
      )
    } else {
      setSaleItems((currentItems) => [
        ...currentItems,
        {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity,
          unit_price: Number(selectedProduct.sale_price),
          current_stock: Number(selectedProduct.current_stock),
        },
      ])
    }

    setForm((currentForm) => ({
      ...currentForm,
      product_id: '',
      quantity: '',
    }))
  }

  function handleRemoveItem(productId) {
    setSaleItems((currentItems) =>
      currentItems.filter((item) => item.product_id !== productId),
    )
  }

  async function handleFinishSale() {
    setMessage(null)

    if (!form.customer_id) {
      setMessage({
        type: 'error',
        text: 'Cliente é obrigatório para registrar venda.',
      })
      return
    }

    if (saleItems.length === 0) {
      setMessage({
        type: 'error',
        text: 'Adicione pelo menos um produto para finalizar a venda.',
      })
      return
    }

    const hasInsufficientStock = saleItems.some((item) => {
      const currentProduct = products.find(
        (product) => product.id === item.product_id,
      )

      return (
        !currentProduct ||
        Number(currentProduct.current_stock) <= 0 ||
        item.quantity > Number(currentProduct.current_stock)
      )
    })

    if (hasInsufficientStock) {
      setMessage({
        type: 'error',
        text: 'Estoque insuficiente para este produto.',
      })
      return
    }

    setSaving(true)

    try {
      await registerSale({
        customerId: form.customer_id,
        items: saleItems,
      })

      setForm(initialSaleForm)
      setSaleItems([])
      setMessage({ type: 'success', text: 'Venda registrada com sucesso.' })
      await refreshSaleData()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const availableProducts = products.filter(
    (product) => Number(product.current_stock) > 0,
  )
  const totalAmount = saleItems.reduce(
    (total, item) => total + item.quantity * item.unit_price,
    0,
  )

  const itemColumns = [
    { header: 'Produto', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Quantidade', accessor: 'quantity' },
    {
      header: 'Preço unitário',
      key: 'unit_price',
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      header: 'Subtotal',
      key: 'subtotal',
      render: (item) => formatCurrency(item.quantity * item.unit_price),
    },
    {
      header: 'Ações',
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleRemoveItem(item.product_id)}
            disabled={saving}
          >
            Remover
          </Button>
        </div>
      ),
    },
  ]

  const saleColumns = [
    {
      header: 'Data',
      key: 'sale_date',
      render: (sale) => formatDate(sale.sale_date),
    },
    {
      header: 'Cliente',
      key: 'customer',
      render: (sale) => sale.customer?.name || '-',
    },
    {
      header: 'Vendedor',
      key: 'seller',
      render: (sale) => sale.seller?.name || '-',
    },
    {
      header: 'Total',
      key: 'total_amount',
      render: (sale) => formatCurrency(sale.total_amount),
    },
    {
      header: 'Status',
      key: 'status',
      render: (sale) => (
        <span className="status status--active">
          {getStatusLabel(sale.status)}
        </span>
      ),
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Vendas</h1>
          <p>Registre vendas usando a baixa automática do banco.</p>
        </div>
      </div>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      <section className="form-panel sale-panel">
        <div className="form-panel__header">
          <h2>Nova venda</h2>
          <p>A venda será vinculada automaticamente ao usuário logado.</p>
        </div>

        <label className="field" htmlFor="saleCustomer">
          <span className="field__label">Cliente</span>
          <select
            id="saleCustomer"
            name="saleCustomer"
            className="field__input"
            value={form.customer_id}
            onChange={(event) =>
              updateFormField('customer_id', event.target.value)
            }
            disabled={loading || saving}
            required
          >
            <option value="">
              {loading ? 'Carregando clientes...' : 'Selecione um cliente'}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <Link className="button button--secondary sale-customer-link" to="/clientes">
          Cadastrar cliente
        </Link>

        <form className="sale-item-form" onSubmit={handleAddItem}>
          <label className="field" htmlFor="saleProduct">
            <span className="field__label">Produto com estoque</span>
            <select
              id="saleProduct"
              name="saleProduct"
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
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - estoque {product.current_stock} -{' '}
                  {formatCurrency(product.sale_price)}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Quantidade"
            name="saleQuantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(event) => updateFormField('quantity', event.target.value)}
            disabled={saving}
            required
          />

          <Button type="submit" disabled={loading || saving}>
            Adicionar item
          </Button>
        </form>

        <div className="sale-items-section">
          <h3>Itens da venda</h3>
          <Table
            columns={itemColumns}
            data={saleItems}
            emptyMessage="Nenhum item adicionado."
          />
        </div>

        <div className="sale-summary">
          <span>Total da venda</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            onClick={handleFinishSale}
            disabled={loading || saving}
          >
            {saving ? 'Finalizando...' : 'Finalizar venda'}
          </Button>
        </div>
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Vendas registradas</h2>
        </div>

        {loading ? (
          <div className="content-state">Carregando vendas...</div>
        ) : (
          <Table
            columns={saleColumns}
            data={sales}
            emptyMessage="Nenhuma venda registrada."
          />
        )}
      </section>
    </section>
  )
}

export default Vendas
