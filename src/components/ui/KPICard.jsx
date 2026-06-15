import React from 'react'

export default function KPICard({ label, value, icon: Icon, delta, color = 'brand' }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <div className="flex items-end space-x-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {delta && (
            <span className={`text-sm font-medium mb-1 ${delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {delta}
            </span>
          )}
        </div>
      </div>
      <div className={`p-4 rounded-full bg-${color}-50 text-${color}-600`}>
        {Icon && <Icon className="w-8 h-8" />}
      </div>
    </div>
  )
}
