import { supabase } from './supabaseClient'

export async function getCustomersByVendor(vendorId) {
  const { data: quotations, error: quotationsError } = await supabase
    .from('quotations')
    .select(`
      drawing_requests (
        users (
          id, full_name, email, phone, created_at
        )
      )
    `)
    .eq('vendor_id', vendorId)

  if (quotationsError) return { error: quotationsError }

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

  // Fetch paid payments for this vendor to calculate spent per user
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select(`
      amount,
      drawing_request_id,
      drawing_requests (
        user_id
      )
    `)
    .eq('vendor_id', vendorId)
    .eq('payment_status', 'paid')

  if (!paymentsError && payments) {
    payments.forEach(p => {
      if (p.drawing_requests && p.drawing_requests.user_id) {
        const userId = p.drawing_requests.user_id;
        if (userMap.has(userId)) {
          const user = userMap.get(userId);
          user.total_spent += Number(p.amount);
        }
      }
    });
  }

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
