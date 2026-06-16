import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrawings } from '../../controllers/drawingController'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatDate } from '../../utils/formatters'
import { Search, Inbox, Download } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import DrawingDetailModal from './DrawingDetailPage'

export default function DrawingsListPage() {
  const navigate = useNavigate()
  const { data: drawings, isLoading } = useDrawings()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDrawingId, setSelectedDrawingId] = useState(null)

  const filteredDrawings = drawings?.filter(d => {
    const statusMatch = filter === 'all' || d.status === filter
    const searchMatch = !search || 
      d.file_name?.toLowerCase().includes(search.toLowerCase()) || 
      d.users?.full_name?.toLowerCase().includes(search.toLowerCase())
    return statusMatch && searchMatch
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1500px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
        {/* Filters */}
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto hide-scrollbar gap-1 max-w-full shadow-sm w-full md:w-auto">
          {['all', 'pending', 'submitted', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                filter === f 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {f === 'submitted' ? 'Quoted' : f}
            </button>
          ))}
        </div>
        
        {/* Search Bar */}
        <div className="relative group w-full md:w-80 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search files or customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm font-medium text-gray-900 placeholder-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="grid gap-4 mt-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-white rounded-lg animate-pulse border border-gray-100"></div>
          ))}
        </div>
      ) : filteredDrawings?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 border-dashed mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-gray-50/50">
            <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500 max-w-sm text-center">There are no drawing requests matching your current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attached File</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sent Date</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrawings?.map((drawing) => (
                  <tr key={drawing.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {drawing.users?.full_name || 'Unknown Customer'}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      <a 
                        href={drawing.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-blue-700 flex items-center gap-1.5 transition-colors font-bold"
                      >
                        <Download className="w-4 h-4" /> Download File
                      </a>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 max-w-[200px] truncate">
                      {drawing.notes || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(drawing.created_at)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <StatusBadge status={drawing.status || 'pending'} />
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedDrawingId(drawing.id)}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                        title="View Details & Quote"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={!!selectedDrawingId} 
        onClose={() => setSelectedDrawingId(null)} 
        title="Request Details"
        maxWidth="max-w-5xl"
      >
        {selectedDrawingId && (
          <DrawingDetailModal drawingId={selectedDrawingId} onClose={() => setSelectedDrawingId(null)} />
        )}
      </Modal>
    </div>
  )
}
