import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export default function ProtectedRoute({ children }) {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
    </div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
