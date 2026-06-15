import React, { useState } from 'react'
import { useCustomers, useCustomerById } from '../../controllers/customerController'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Mail, Phone, Calendar } from 'lucide-react'

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers()
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const { data: customerDetails, isLoading: detailsLoading } = useCustomerById(selectedCustomerId)

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading customers...</div>
  }

  const getInitials = (name) => name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'C'

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Customers</h2>

      {customers?.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers?.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => setSelectedCustomerId(customer.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:border-brand hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-lg group-hover:bg-brand group-hover:text-white transition-colors">
                  {getInitials(customer.name)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{customer.name}</h3>
                  <p className="text-xs text-gray-500">Customer since {new Date(customer.created_at).getFullYear()}</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-semibold text-brand">{formatCurrency(customer.total_spent)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal isOpen={!!selectedCustomerId} onClose={() => setSelectedCustomerId(null)} title="Customer Details">
        {detailsLoading || !customerDetails ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading details...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-2xl">
                {getInitials(customerDetails.name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{customerDetails.name}</h3>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-1"/> {customerDetails.email}</span>
                  {customerDetails.phone && <span className="flex items-center"><Phone className="w-4 h-4 mr-1"/> {customerDetails.phone}</span>}
                </div>
              </div>
            </div>

            <div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
