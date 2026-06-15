import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useVendor } from '../context/VendorContext'
import { getQuotationsByVendor, getQuotationsByCompany, createQuotation, updateQuotation } from '../models/quotationModel'

export function useQuotations() {
  const { vendorProfile } = useVendor()
  const companyId = vendorProfile?.company_id

  return useQuery({
    queryKey: ['quotations', companyId],
    queryFn: async () => {
      const { data, error } = await getQuotationsByCompany(companyId)
      if (error) throw error
      return data
    },
    enabled: !!companyId
  })
}

export function useCreateQuotation() {
  const queryClient = useQueryClient()
  const { vendorProfile } = useVendor()
  const vendorId = vendorProfile?.id
  const companyId = vendorProfile?.company_id

  return useMutation({
    mutationFn: async ({ drawingRequestId, pdfUrl, notes }) => {
      if (!pdfUrl) throw new Error('Quotation PDF is required')
      
      const { data, error } = await createQuotation({ 
        drawingRequestId, 
        vendorId, 
        companyId, 
        pdfUrl, 
        notes 
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      toast.success('Quotation sent successfully')
      
      // Manually mark this drawing as read in localStorage to immediately update the notification badge
      try {
        const vendorId = variables.vendorId || vendorProfile?.id;
        const saved = localStorage.getItem(`read_notifications_${vendorId}`);
        const readIds = saved ? JSON.parse(saved) : [];
        if (!readIds.includes(variables.drawingRequestId)) {
          const newIds = [...readIds, variables.drawingRequestId];
          localStorage.setItem(`read_notifications_${vendorId}`, JSON.stringify(newIds));
          // Dispatch a custom event so the notificationController can pick up the change
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error("Failed to mark as read", e);
      }

      queryClient.invalidateQueries(['quotations', companyId])
      queryClient.invalidateQueries(['drawings', companyId]) 
    },
    onError: (error) => toast.error(error.message)
  })
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient()
  const { vendorProfile } = useVendor()
  const companyId = vendorProfile?.company_id

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: resData, error } = await updateQuotation(id, data)
      if (error) throw error
      return resData
    },
    onSuccess: () => {
      toast.success('Quotation updated successfully')
      queryClient.invalidateQueries(['quotations', companyId])
    },
    onError: (error) => toast.error(error.message)
  })
}
