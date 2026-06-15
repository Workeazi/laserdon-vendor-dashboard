import { supabase } from './supabaseClient'

export async function getNotifications(vendorId) {
  return await supabase
    .from('notifications')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(50)
}

export async function markAsRead(id) {
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
}

export async function markAllRead(vendorId) {
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('vendor_id', vendorId)
    .eq('is_read', false)
}

export async function insertNotification(data) {
  return await supabase
    .from('notifications')
    .insert(data)
    .select()
}
