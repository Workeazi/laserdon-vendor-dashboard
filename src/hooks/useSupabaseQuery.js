import { useQuery } from '@tanstack/react-query'

export function useSupabaseQuery(queryKey, fetchFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await fetchFn()
      if (error) throw error
      return data
    },
    ...options
  })
}
