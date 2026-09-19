import React, { useState } from 'react'
import { useQuotations, useUpdateQuotation } from '../../controllers/quotationController'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/formatters'
import { Edit2, Send, Download, File as FileIcon, Search } from 'lucide-react'

export default function QuotationsPage() {
  const { data: quotations, isLoading } = useQuotations()
  const { mutate: updateQuotation, isPending } = useUpdateQuotation()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-newest')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedQuote, setSelectedQuote] = useState(null)
  
  // Edit form state
  const [notes, setNotes] = useState('')

  const filteredQuotes = quotations?.filter(q => {
    const statusMatch = filter === 'all' || q.status === filter
    
    // Search match based on user name (customer)
    const searchMatch = !search || 
      q.drawing_requests?.users?.full_name?.toLowerCase().includes(search.toLowerCase())
      
    // Date match based on created_at
    let dateMatch = true
    if (dateFilter) {
      if (q.created_at) {
        const quoteDate = new Date(q.created_at).toISOString().split('T')[0]
        dateMatch = (quoteDate === dateFilter)
      } else {
        dateMatch = false
      }
    }
    
    return statusMatch && searchMatch && dateMatch
  }).sort((a, b) => {
    if (sortBy === 'date-newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    }
    if (sortBy === 'date-oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    }
    if (sortBy === 'price-high') {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
    }
    if (sortBy === 'price-low') {
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
    }
    return 0
  })

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
      render: (row) => {
        const fileUrl = row.drawing_requests?.file_url;
        let displayFileName = '';
        if (fileUrl) {
          try {
            const parts = fileUrl.split('/');
            displayFileName = parts[parts.length - 1].split('?')[0];
          } catch(e) {}
        }
        return (
          <div>
            <span className="font-bold text-gray-900 block">{row.drawing_requests?.users?.full_name || 'Unknown User'}</span>
            {displayFileName && (
              <span className="text-[11px] text-gray-500 mt-0.5 block truncate max-w-[200px]" title={displayFileName}>
                File: {displayFileName}
              </span>
            )}
          </div>
        )
      }
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
    { 
      key: 'price', 
      label: 'Price', 
      render: (row) => <span className="font-semibold text-gray-900">{row.price ? `₹${parseFloat(row.price).toFixed(2)}` : '-'}</span> 
    },
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center space-y-4 xl:space-y-0 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Status Buttons */}
          <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 shrink-0">
            {['all', 'submitted', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  filter === f ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Controls: Search, Sort, Date */}
          <div className="flex flex-row items-center gap-3 shrink-0">
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm h-[38px]"
                title="Filter by Date"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
                >
                  Clear Date
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm h-[38px] cursor-pointer"
            >
              <option value="date-newest">Newest First</option>
              <option value="date-oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>

            <div className="relative group flex-shrink-0 w-48 md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm font-medium text-gray-900 placeholder-gray-400 shadow-sm h-[38px]"
              />
            </div>
          </div>
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
