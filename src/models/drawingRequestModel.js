import { supabase } from './supabaseClient'

export async function getDrawingRequestsByCompany(companyId) {
  return await supabase
    .from('drawing_requests')
    .select('*')
    .eq('company_id', companyId)
}
