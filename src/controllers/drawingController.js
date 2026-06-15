import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useVendor } from '../context/VendorContext'
import { getDrawingsByCompany, getDrawingById, uploadDrawingFile, updateDrawingStatus } from '../models/drawingModel'

export function useDrawings() {
  const { vendorProfile } = useVendor()
  return useQuery({
    queryKey: ['drawings', vendorProfile?.company_id],
    queryFn: async () => {
      const { data, error } = await getDrawingsByCompany(vendorProfile.company_id)
      if (error) throw error
      return data
    },
    enabled: !!vendorProfile?.company_id
  })
}

export function useDrawingById(id) {
  return useQuery({
    queryKey: ['drawing', id],
    queryFn: async () => {
      const { data, error } = await getDrawingById(id)
      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export function useUploadDrawing() {
  const queryClient = useQueryClient()
  const { vendorId } = useVendor()

  return useMutation({
    mutationFn: async ({ file }) => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type) && !file.name.endsWith('.dwg')) {
        throw new Error('Invalid file type')
      }
      if (file.size > 20 * 1024 * 1024) throw new Error('File exceeds 20MB limit')
      
      const storagePath = `${vendorId}/${Date.now()}_${file.name}`
      const { data, error } = await uploadDrawingFile(file, storagePath)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('File uploaded successfully')
      queryClient.invalidateQueries(['drawings'])
    },
    onError: (error) => toast.error(error.message)
  })
}
