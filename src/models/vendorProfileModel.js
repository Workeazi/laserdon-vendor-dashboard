import { supabase } from './supabaseClient'

export async function getVendorProfile(userId) {
  return await supabase
    .from('vendors')
    .select('*, companies(*)')
    .eq('id', userId)
    .single()
}

export async function updateCompanyProfile(companyId, data) {
  return await supabase
    .from('companies')
    .update(data)
    .eq('id', companyId)
    .select()
}

export async function uploadCompanyImage(file, path) {
  console.log('Attempting to upload file:', file.name, 'to path:', path);
  const { data, error } = await supabase.storage.from('vendor_profile_image').upload(path, file, { 
    upsert: true,
    contentType: file.type || 'image/jpeg'
  })
  if (error) {
    console.error('Supabase storage upload error:', error);
    return { error }
  }
  const { data: publicUrlData } = supabase.storage.from('vendor_profile_image').getPublicUrl(path)
  return { data: { ...data, publicUrl: publicUrlData.publicUrl } }
}

export async function updateVendorProfile(id, data) {
  return await supabase
    .from('vendors')
    .update(data)
    .eq('id', id)
    .select()
}

export async function uploadDocument(file, path) {
  const { data, error } = await supabase.storage.from('vendor_business_documents').upload(path, file, { upsert: true })
  if (error) return { error }
  const { data: publicUrlData } = supabase.storage.from('vendor_business_documents').getPublicUrl(path)
  return { data: { ...data, publicUrl: publicUrlData.publicUrl } }
}

export async function getDocumentUrl(path) {
  const { data } = supabase.storage.from('vendor_business_documents').getPublicUrl(path)
  return { data }
}
