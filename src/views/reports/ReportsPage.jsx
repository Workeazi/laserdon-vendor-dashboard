import React from 'react'
import { useReports } from '../../controllers/reportController'
import RequestsLineChart from '../../components/charts/RequestsLineChart'
import KPICard from '../../components/ui/KPICard'
import { IndianRupee, ShoppingCart, Percent, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export default function ReportsPage() {
  const { data, isLoading } = useReports()

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading reports...</div>
  }

  const { revenueData, requestStats, topServices } = data || {}

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + curr.revenue, 0) || 0
  const totalRequests = requestStats ? Object.values(requestStats).reduce((a, b) => a + b, 0) : 0
  const completedRequests = requestStats?.completed || 0
  const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0
  const avgValue = completedRequests > 0 ? totalRevenue / completedRequests : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Revenue (12m)" value={formatCurrency(totalRevenue)} icon={IndianRupee} color="green" />
        <KPICard label="Total Requests" value={totalRequests} icon={ShoppingCart} color="blue" />
        <KPICard label="Avg Value" value={formatCurrency(avgValue)} icon={TrendingUp} color="brand" />
        <KPICard label="Completion Rate" value={`${completionRate}%`} icon={Percent} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Over Time</h3>
          <RequestsLineChart data={revenueData} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Top Services</h3>
          <div className="space-y-6">
            {topServices?.map((service, idx) => {
              const maxCount = Math.max(...topServices.map(s => s.count))
              const percentage = Math.round((service.count / maxCount) * 100)
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{service.name}</span>
                    <span className="text-gray-500">{service.count} requests</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-brand h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
            {(!topServices || topServices.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
