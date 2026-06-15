import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useVendor } from '../context/VendorContext'
import { signInWithEmail, signOut } from '../models/authModel'
import { getVendorProfile } from '../models/vendorProfileModel'

export function useAuth() {
  const { vendorProfile: vendor, isLoading, refetchProfile } = useVendor()
  const navigate = useNavigate()

  const login = async (email, password) => {
    const { data, error } = await signInWithEmail(email, password)
    if (error) {
      toast.error(error.message)
      return { error }
    }

    // Check approval status
    const { data: profile, error: profileError } = await getVendorProfile(data.user.id)
    
    if (profileError || !profile) {
      await signOut()
      toast.error('Could not fetch vendor profile')
      return { error: profileError || new Error('Profile not found') }
    }
    
    if (profile.status === 'pending') {
      await signOut()
      toast.error('Your account is pending admin approval.')
      return { error: new Error('Pending approval') }
    }
    
    if (profile.status === 'rejected') {
      await signOut()
      toast.error('Your application was rejected.')
      return { error: new Error('Rejected') }
    }
    
    if (profile.status === 'inactive') {
      await signOut()
      toast.error('Your account is inactive.')
      return { error: new Error('Inactive') }
    }

    toast.success('Logged in successfully')
    await refetchProfile()
    navigate('/dashboard')
    return { data }
  }

  const logout = async () => {
    await signOut()
    await refetchProfile()
    navigate('/login')
  }

  return { vendor, isLoading, login, logout }
}
