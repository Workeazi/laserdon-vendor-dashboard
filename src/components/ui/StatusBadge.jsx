import React from 'react'

export default function StatusBadge({ status }) {
  const map = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    quoted: { bg: 'bg-blue-100', text: 'text-blue-700' },
    approved: { bg: 'bg-green-100', text: 'text-green-700' },
    accepted: { bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700' },
    completed: { bg: 'bg-teal-100', text: 'text-teal-700' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700' },
    disputed: { bg: 'bg-orange-100', text: 'text-orange-700' },
  }

  const s = status?.toLowerCase() || 'pending'
  const styles = map[s] || map.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles.bg} ${styles.text}`}>
      {status}
    </span>
  )
}
