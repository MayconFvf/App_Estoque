import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import { listActiveStockProducts } from '../services/inventoryService'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function getStockStatus(product) {
  return Number(product.current_stock) <= Number(product.minimum_stock)
    ? 'low'
    : 'normal'
}

function getStockStatusLabel(product) {
  return getStockStatus(product) === 'low' ? 'Estoque baixo' : 'Normal'
}

function Estoque() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  async function loadStockProducts() {
    setLoading(true)

    try {
      const data = await listActiveStockProducts(searchTerm)
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

  async function handleSearch(event) {
    event.preventDefault()
    setMessage(null)
    await loadStockProducts()
  }

  const filteredProducts = products.filter((product) => {
    if (statusFilter === 'all') {
      return true
    }

    return getStockStatus(product) === statusFilter
  })

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Marca', accessor: 'brand' },
    { header: 'Categoria', accessor: 'category' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Estoque atual', accessor: 'current_stock' },
    { header: 'Estoque mínimo', accessor: 'minimum_stock' },
    {
      header: 'Preço',
      key: 'sale_price',
      render: (product) => formatCurrency(product.sale_price),
    },
    {
      header: 'Status',
      key: 'stock_status',
      render: (product) => {
        const status = getStockStatus(product)

        return (
          <span className={status === 'low' ? 'status status--low' : 'status status--active'}>
            {getStockStatusLabel(product)}
          </span>
        )
      },
    },
  ]

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Estoque atual</h1>
          <p>Consulte produtos ativos e acompanhe níveis de estoque.</p>
        </div>
      </div>

      <form className="toolbar toolbar--stock" onSubmit={handleSearch}>
        <Input
          label="Buscar por nome"
          name="stockSearch"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Digite o nome do produto"
        />

        <label className="field" htmlFor="stockStatusFilter">
          <span className="field__label">Status</span>
          <select
            id="stockStatusFilter"
            name="stockStatusFilter"
            className="field__input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="normal">Normal</option>
            <option value="low">Estoque baixo</option>
          </select>
        </label>

        <Button type="submit" disabled={loading}>
          Buscar
        </Button>
      </form>

      {message && (
        <p className={`form-message form-message--${message.type}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <div className="content-state">Carregando estoque...</div>
      ) : (
        <Table
          columns={columns}
          data={filteredProducts}
          emptyMessage="Nenhum produto ativo encontrado."
        />
      )}
    </section>
  )
}

export default Estoque
