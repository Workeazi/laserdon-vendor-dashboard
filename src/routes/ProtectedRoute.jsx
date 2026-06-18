import React, { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useVendor } from '../context/VendorContext'
import { supabase } from '../models/supabaseClient'

export default function ProtectedRoute({ children }) {
  const { session, isLoading: sessionLoading } = useSession()
  const { vendorProfile, isLoading: profileLoading } = useVendor()
  const navigate = useNavigate()

  const isLoading = sessionLoading || profileLoading

  useEffect(() => {
    // If we have a profile but they are not approved, force sign out and redirect
    if (vendorProfile && vendorProfile.status !== 'approved') {
      const forceLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login', { 
          state: { 
            message: vendorProfile.status === 'pending' 
              ? 'Your account is pending admin approval.' 
              : 'Your account is not active.' 
          } 
        })
      }
      forceLogout()
    }
  }, [vendorProfile, navigate])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
    </div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Prevent rendering children if profile exists but not approved
  if (vendorProfile && vendorProfile.status !== 'approved') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
    </div>
  }

  return children
}
