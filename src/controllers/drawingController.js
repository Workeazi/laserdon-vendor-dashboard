import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useVendor } from '../context/VendorContext'
import { getDrawingsByCompany, getDrawingById, uploadDrawingFile, updateDrawingStatus } from '../models/drawingModel'
import { getQuotationsByCompany } from '../models/quotationModel'

export function useDrawings() {
  const { vendorProfile } = useVendor()
  return useQuery({
    queryKey: ['drawings', vendorProfile?.company_id],
    queryFn: async () => {
      const { data, error } = await getDrawingsByCompany(vendorProfile.company_id)
      if (error) throw error

      const { data: quotes } = await getQuotationsByCompany(vendorProfile.company_id)

      return data.map(d => {
        let status = d.status
        const myQuotes = quotes ? quotes.filter(q => q.drawing_request_id === d.id) : []
        if (myQuotes.length > 0) {
          const sortedQuotations = [...myQuotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          status = sortedQuotations[0].status
        } else if (d.quotations && d.quotations.length > 0) {
          const sortedQuotations = [...d.quotations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          status = sortedQuotations[0].status
        }
        return { ...d, status }
      })
    },
    enabled: !!vendorProfile?.company_id
  })
}

export function useDrawingById(id) {
  const { vendorProfile } = useVendor()
  return useQuery({
    queryKey: ['drawing', id],
    queryFn: async () => {
      const { data, error } = await getDrawingById(id)
      if (error) throw error
      if (data && vendorProfile?.company_id) {
        const { data: quotes } = await getQuotationsByCompany(vendorProfile.company_id)
        const myQuotes = quotes ? quotes.filter(q => q.drawing_request_id === data.id) : []
        if (myQuotes.length > 0) {
          const sortedQuotations = [...myQuotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          data.status = sortedQuotations[0].status
        } else if (data.quotations && data.quotations.length > 0) {
          const sortedQuotations = [...data.quotations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          data.status = sortedQuotations[0].status
        }
      }
      return data
    },
    enabled: !!id && !!vendorProfile?.company_id
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
