import React, { useState } from 'react'
import { useQuotations, useUpdateQuotation } from '../../controllers/quotationController'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/formatters'
import { Edit2, Send, Download, File as FileIcon } from 'lucide-react'

export default function QuotationsPage() {
  const { data: quotations, isLoading } = useQuotations()
  const { mutate: updateQuotation, isPending } = useUpdateQuotation()
  const [filter, setFilter] = useState('all')
  const [selectedQuote, setSelectedQuote] = useState(null)
  
  // Edit form state
  const [notes, setNotes] = useState('')

  const filteredQuotes = quotations?.filter(q => filter === 'all' || q.status === filter)

  const handleEdit = (quote) => {
    setSelectedQuote(quote)
    setNotes(quote.notes || '')
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    updateQuotation(
      { 
        id: selectedQuote.id, 
        data: { notes, status: selectedQuote.status } 
      },
      {
        onSuccess: () => setSelectedQuote(null)
      }
    )
  }

  const columns = [
    { 
      key: 'request', 
      label: 'Drawing Request', 
      render: (row) => <span className="font-medium text-gray-900">{row.drawing_requests?.users?.full_name || 'Unknown User'}</span> 
    },
    { 
      key: 'pdf_url', 
      label: 'Quotation File', 
      render: (row) => (
        <a 
          href={row.pdf_url || '#'} 
          download={`Quotation_${row.id}.pdf`}
          target="_blank" 
          rel="noreferrer" 
          onClick={(e) => { 
            e.stopPropagation();
            if (!row.pdf_url) {
              e.preventDefault();
              alert('No PDF file available for this quotation.');
            }
          }}
          className="flex items-center text-primary hover:text-blue-700 font-medium"
        >
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </a>
      ) 
    },
    { key: 'notes', label: 'Notes', render: (row) => <span className="truncate max-w-[200px] block" title={row.notes}>{row.notes || '-'}</span> },
    { key: 'date', label: 'Sent Date', render: (row) => formatDate(row.created_at) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      key: 'actions', 
      label: '', 
      render: (row) => row.status === 'submitted' ? (
        <button 
          onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
          className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit Notes"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) : null
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
        <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200">
          {['all', 'submitted', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} rows={filteredQuotes} isLoading={isLoading} />

      <Modal isOpen={!!selectedQuote} onClose={() => setSelectedQuote(null)} title="Edit Quotation Notes">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
            <textarea
              rows="5"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">To change the quotation document, you would need to submit a new request or cancel this one depending on the workflow.</p>
          </div>
          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={() => setSelectedQuote(null)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" /> {isPending ? 'Saving...' : 'Update Notes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
