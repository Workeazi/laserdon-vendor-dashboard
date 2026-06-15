import { supabase } from './supabaseClient'

// Note: In a real app with large data, these would ideally be RPC calls.
// For now, we will fetch and aggregate on the client side for simplicity.

export async function getRevenueByMonth(vendorId) {
  // Orders are removed, so returning mock data or empty
  return { data: [] }
}

export async function getRequestStats(vendorId) {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    // We would normally join project_files or filter by vendor_id directly if projects had vendor_id
    // But schema says projects.user_id. Wait, project_files has vendor_id.
    // Let's query project_files instead.

  const { data: filesData, error: filesError } = await supabase
    .from('project_files')
    .select('projects(status)')
    .eq('vendor_id', vendorId)

  if (filesError) return { error: filesError }

  const stats = { pending: 0, quoted: 0, approved: 0, rejected: 0, completed: 0 }
  filesData.forEach(file => {
    const status = file.projects?.status || 'pending'
    if (stats[status] !== undefined) stats[status]++
  })

  return { data: stats }
}

export async function getTopServices(vendorId) {
  // Using mock data for services
  return { data: [
    { name: 'Laser Cutting', count: 120 },
    { name: 'CNC Machining', count: 85 },
    { name: 'Sheet Metal', count: 40 }
  ] }
}
