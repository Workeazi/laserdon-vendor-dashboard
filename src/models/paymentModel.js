import { supabase } from './supabaseClient'

export async function getPaymentsByVendor(vendorId) {
  return await supabase
    .from('payments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('payment_date', { ascending: false })
}

export async function getTotalRevenueByVendor(vendorId) {
  // Aggregate sum of amount for paid payments
  // Note: For complex aggregations, a Postgres RPC is best. 
  // However, fetching the sum directly or calculating locally if volume is low.
  // We'll calculate it by fetching just the amounts since Supabase JS client doesn't support sum directly without RPC.
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('vendor_id', vendorId)
    .eq('payment_status', 'paid')
    
  if (error) return { data: 0, error }
  
  const total = data.reduce((sum, row) => sum + Number(row.amount), 0)
  return { data: total, error: null }
}
