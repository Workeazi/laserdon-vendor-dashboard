import { useQuery } from '@tanstack/react-query'
import { getPaymentsByVendor, getTotalRevenueByVendor } from '../models/paymentModel'

export function usePayments(vendorId) {
  return useQuery({
    queryKey: ['payments', vendorId],
    queryFn: async () => {
      if (!vendorId) return []
      const { data, error } = await getPaymentsByVendor(vendorId)
      if (error) throw error
      return data || []
    },
    enabled: !!vendorId
  })
}

export function useTotalRevenue(vendorId) {
  return useQuery({
    queryKey: ['revenue', vendorId],
    queryFn: async () => {
      if (!vendorId) return 0
      const { data, error } = await getTotalRevenueByVendor(vendorId)
      if (error) throw error
      return data || 0
    },
    enabled: !!vendorId
  })
}
