function Table({ columns = [], data = [], emptyMessage = 'Nenhum registro encontrado.' }) {
  function getColumnType(column, index) {
    const normalizedHeader = String(column.header || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (normalizedHeader === 'acoes') {
      return 'actions'
    }

    if (normalizedHeader === 'status') {
      return 'status'
    }

    if (index === 0) {
      return 'primary'
    }

    if (index === 1 && columns.length > 3) {
      return 'secondary'
    }

    return 'default'
  }

  function getCellClass(column, index) {
    return `table__cell table__cell--${getColumnType(column, index)}`
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key || column.accessor}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="table__empty-cell" colSpan={columns.length || 1}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key || column.accessor}
                    className={getCellClass(column, columnIndex)}
                    data-label={column.header}
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
