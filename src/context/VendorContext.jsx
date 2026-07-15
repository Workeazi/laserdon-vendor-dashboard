import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { getVendorProfile } from '../models/vendorProfileModel'

const VendorContext = createContext()

export function VendorProvider({ children }) {
  const { session, isLoading: isSessionLoading } = useSession()
  const [vendorProfile, setVendorProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  const fetchProfile = async () => {
    if (session?.user) {
      setIsProfileLoading(true)
      try {
        const { data } = await getVendorProfile(session.user.id)
        setVendorProfile(data)
      } catch (err) {
        console.error('Error fetching vendor profile:', err)
      } finally {
        setIsProfileLoading(false)
      }
    } else {
      setVendorProfile(null)
      setIsProfileLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [session])

  const isLoading = isSessionLoading || isProfileLoading

  return (
    <VendorContext.Provider value={{ session, vendorProfile, vendorId: vendorProfile?.id, refetchProfile: fetchProfile, isLoading }}>
      {children}
    </VendorContext.Provider>
  )
}

export function useVendor() {
  return useContext(VendorContext)
}
