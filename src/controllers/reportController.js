import { useQuery } from '@tanstack/react-query'
import { useVendor } from '../context/VendorContext'
import { getRevenueByMonth, getRequestStats, getTopServices } from '../models/reportModel'

export function useReports() {
  const { vendorId } = useVendor()

  return useQuery({
    queryKey: ['reports', vendorId],
    queryFn: async () => {
      const [revenueRes, statsRes, servicesRes] = await Promise.all([
        getRevenueByMonth(vendorId),
        getRequestStats(vendorId),
        getTopServices(vendorId)
      ])

      if (revenueRes.error) throw revenueRes.error
      if (statsRes.error) throw statsRes.error
      if (servicesRes.error) throw servicesRes.error

      return {
        revenueData: revenueRes.data,
        requestStats: statsRes.data,
        topServices: servicesRes.data
      }
    },
    enabled: !!vendorId
  })
}
