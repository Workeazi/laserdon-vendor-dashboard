import { useQuery } from '@tanstack/react-query'
import { useVendor } from '../context/VendorContext'
import { getCustomersByVendor, getCustomerById } from '../models/customerModel'

export function useCustomers() {
  const { vendorId } = useVendor()
  return useQuery({
    queryKey: ['customers', vendorId],
    queryFn: async () => {
      const { data, error } = await getCustomersByVendor(vendorId)
      if (error) throw error
      return data
    },
    enabled: !!vendorId
  })
}

export function useCustomerById(id) {
  const { vendorId } = useVendor()
  return useQuery({
    queryKey: ['customer', id, vendorId],
    queryFn: async () => {
      const { data, error } = await getCustomerById(id, vendorId)
      if (error) throw error
      return data
    },
    enabled: !!id && !!vendorId
  })
}
