import { supabase } from './supabaseClient'

export async function getRevenueByMonth(vendorId) {
  // Fetch paid payments for this vendor
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('vendor_id', vendorId)
    .eq('payment_status', 'paid')

  if (error) return { error }

  // Generate last 12 months array chronologically
  const last12Months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthName = d.toLocaleString('default', { month: 'short' })
    const year = d.getFullYear()
    last12Months.push({
      key: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: `${monthName} ${year}`,
      revenue: 0
    })
  }

  // Populate payments
  if (payments) {
    payments.forEach(p => {
      if (!p.payment_date) return
      const pDate = new Date(p.payment_date)
      const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`
      const match = last12Months.find(m => m.key === key)
      if (match) {
        match.revenue += Number(p.amount)
      }
    })
  }

  // Clean the helper key before returning to UI
  const result = last12Months.map(({ month, revenue }) => ({
    month,
    revenue
  }))

  return { data: result }
}

export async function getRequestStats(vendorId) {
  // Get vendor's company_id
  const { data: vendor, error: vendorErr } = await supabase
    .from('vendors')
    .select('company_id')
    .eq('id', vendorId)
    .single()

  if (vendorErr || !vendor) {
    return { data: { pending: 0, accepted: 0, rejected: 0, completed: 0 } }
  }

  const companyId = vendor.company_id

  // Fetch all drawing requests for this company
  const { data: drawings, error: drawingsErr } = await supabase
    .from('drawing_requests')
    .select('status')
    .eq('company_id', companyId)

  if (drawingsErr) return { error: drawingsErr }

  const stats = { pending: 0, accepted: 0, rejected: 0, completed: 0 }
  drawings.forEach(d => {
    const status = d.status || 'pending'
    if (stats[status] !== undefined) {
      stats[status]++
    } else {
      // Treat unknown status as pending
      stats.pending++
    }
  })

  return { data: stats }
}

export async function getTopServices(vendorId) {
  // Get vendor's company_id
  const { data: vendor, error: vendorErr } = await supabase
    .from('vendors')
    .select('company_id')
    .eq('id', vendorId)
    .single()

  if (vendorErr || !vendor) {
    return { data: [
      { name: 'Laser Cutting', count: 0 },
      { name: 'CNC Machining', count: 0 },
      { name: 'Sheet Metal', count: 0 }
    ] }
  }

  const companyId = vendor.company_id

  // Fetch drawings to check their notes
  const { data: drawings, error: drawingsErr } = await supabase
    .from('drawing_requests')
    .select('notes')
    .eq('company_id', companyId)

  if (drawingsErr) return { error: drawingsErr }

  const counts = { 'Laser Cutting': 0, 'CNC Machining': 0, 'Sheet Metal': 0 }

  drawings.forEach(d => {
    const notes = (d.notes || '').toLowerCase()
    if (notes.includes('cnc') || notes.includes('machin')) {
      counts['CNC Machining']++
    } else if (notes.includes('sheet') || notes.includes('metal')) {
      counts['Sheet Metal']++
    } else {
      counts['Laser Cutting']++
    }
  })

  const serviceData = Object.entries(counts).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count)

  return { data: serviceData }
}
