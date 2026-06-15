import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function StatusDonutChart({ data }) {
  // data format expected: { pending: 10, quoted: 5, approved: 8, rejected: 2, completed: 15 }
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>

  const chartData = [
    { name: 'Pending', value: data.pending || 0, color: '#f59e0b' },
    { name: 'Quoted', value: data.quoted || 0, color: '#3b82f6' },
    { name: 'Approved', value: data.approved || 0, color: '#10b981' },
    { name: 'Rejected', value: data.rejected || 0, color: '#ef4444' },
    { name: 'Completed', value: data.completed || 0, color: '#14b8a6' },
  ].filter(d => d.value > 0)

  if (chartData.length === 0) return <div className="p-8 text-center text-gray-500">No requests yet</div>

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="h-72 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-3xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  )
}
