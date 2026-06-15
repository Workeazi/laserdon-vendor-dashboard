import React from 'react'
import { useVendor } from '../../context/VendorContext'
import { usePayments, useTotalRevenue } from '../../controllers/paymentController'

export default function PaymentsPage() {
  const { vendorProfile } = useVendor()
  const { data: payments = [], isLoading: isPaymentsLoading, error: paymentsError } = usePayments(vendorProfile?.id)
  const { data: totalRevenue = 0, isLoading: isRevenueLoading } = useTotalRevenue(vendorProfile?.id)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
  }

  if (!vendorProfile?.id) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading profile...</div>
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments & Billing</h2>
          <p className="text-sm text-gray-500 mt-1">View your payment history and total revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 text-brand mb-2">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {isRevenueLoading ? '...' : formatCurrency(totalRevenue)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Payment History</h3>
        </div>
        
        {isPaymentsLoading ? (
          <div className="p-12 text-center text-gray-500">Loading payments...</div>
        ) : paymentsError ? (
          <div className="p-12 text-center text-red-500">Error loading payments.</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl mb-3 text-gray-300">receipt_long</span>
            <p>No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 text-gray-600 whitespace-nowrap">
                      {formatDate(payment.payment_date || payment.created_at)}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {payment.id.split('-')[0]}...
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        payment.payment_status === 'paid' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : payment.payment_status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {payment.payment_status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
