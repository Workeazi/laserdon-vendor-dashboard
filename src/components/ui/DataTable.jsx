import React, { useState } from 'react'

export default function DataTable({ columns, rows, onRowClick, isLoading }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading data...</div>
  }

  if (!rows || rows.length === 0) {
    return <div className="p-8 text-center text-gray-500">No data found.</div>
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig.key) return 0
    const valA = a[sortConfig.key]
    const valB = b[sortConfig.key]
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b">
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(col.key)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, idx) => (
            <tr 
              key={row.id || idx} 
              className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col) => (
                <td key={`${row.id}-${col.key}`} className="px-6 py-4 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
