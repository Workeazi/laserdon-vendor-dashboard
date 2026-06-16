import { supabase } from './supabaseClient'

export async function getDrawingsByCompany(companyId) {
  return await supabase
    .from('drawing_requests')
    .select(`*, companies (*), users (*), quotations(status, created_at)`)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
}

export async function getDrawingById(id) {
  return await supabase
    .from('drawing_requests')
    .select(`*, companies (*), users (*), quotations(status, created_at)`)
    .eq('id', id)
    .single()
}

export async function uploadDrawingFile(file, storagePath) {
  const { data, error } = await supabase.storage.from('drawings').upload(storagePath, file)
  if (error) return { error }
  const { data: publicUrlData } = supabase.storage.from('drawings').getPublicUrl(storagePath)
  return { data: { ...data, publicUrl: publicUrlData.publicUrl } }
}

export async function updateDrawingStatus(id, status) {
  return await supabase
    .from('drawing_requests')
    .update({ status })
    .eq('id', id)
}
