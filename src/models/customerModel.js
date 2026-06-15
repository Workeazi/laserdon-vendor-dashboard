import { supabase } from './supabaseClient'

export async function getCustomersByVendor(vendorId) {
  const { data: quotations, error } = await supabase
    .from('quotations')
    .select(`
      drawing_requests (
        users (
          id, full_name, email, phone, created_at
        )
      )
    `)
    .eq('vendor_id', vendorId)

  if (error) return { error }

  // extract unique users
  const userMap = new Map();
  quotations.forEach(q => {
    if (q.drawing_requests && q.drawing_requests.users) {
      const user = q.drawing_requests.users;
      if (!userMap.has(user.id)) {
        userMap.set(user.id, {
          ...user,
          name: user.full_name,
          total_spent: 0
        });
      }
    }
  });

  return { data: Array.from(userMap.values()) }
}

export async function getCustomerById(id, vendorId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (userError) return { error: userError }

  return { data: { ...user, name: user.full_name, orders: [] } }
}
