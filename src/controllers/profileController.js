import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useVendor } from '../context/VendorContext'
import { updateVendorProfile, uploadDocument, updateCompanyProfile, uploadCompanyImage } from '../models/vendorProfileModel'

export function useVendorProfile() {
  const { vendorProfile: profile, vendorId, isLoading, refetchProfile } = useVendor()
  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const { data: resData, error } = await updateVendorProfile(vendorId, data)
      if (error) throw error
      return resData
    },
    onSuccess: () => {
      toast.success('Profile updated')
      refetchProfile()
    },
    onError: (error) => toast.error(error.message)
  })

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ companyId, data }) => {
      const { data: resData, error } = await updateCompanyProfile(companyId, data)
      if (error) throw error
      return resData
    },
    onSuccess: () => {
      refetchProfile()
    },
    onError: (error) => toast.error(error.message)
  })

  return {
    profile,
    isLoading,
    isSaving: updateProfileMutation.isPending || updateCompanyMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    updateCompany: updateCompanyMutation.mutateAsync,
    uploadDocument: async (file) => {
      const path = `${vendorId}/${file.name}`
      const { data, error } = await uploadDocument(file, path)
      if (error) {
        toast.error('Failed to upload document')
        return null
      }

      // Automatically update status to 'uploaded' so admin knows it's ready for review
      if (profile?.document_status === 'pending' || profile?.document_status === 'rejected') {
        await updateVendorProfile(vendorId, { document_status: 'uploaded' })
        refetchProfile()
      }

      return data
    },
    uploadProfileImage: async (file, companyId) => {
      const path = `company-images/${companyId}/profile_${Date.now()}_${file.name}`
      const { data, error } = await uploadCompanyImage(file, path)
      if (error) {
        toast.error('Failed to upload profile image')
        return null
      }
      return data
    }
  }
}
