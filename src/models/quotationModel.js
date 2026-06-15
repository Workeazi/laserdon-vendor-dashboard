import { supabase } from './supabaseClient'

export async function getQuotationsByVendor(vendorId) {
  // Wait, does vendor know its quotations by vendor_id or company_id? The new table has both.
  // We'll use company_id for broader access, but for now we'll match vendorId if that's what's passed, or company_id.
  return await supabase
    .from('quotations')
    .select(`
      id, drawing_request_id, pdf_url, notes, status, created_at, responded_at,
      drawing_requests ( id, file_url, notes, users (full_name) )
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
}

export async function getQuotationsByCompany(companyId) {
  return await supabase
    .from('quotations')
    .select(`
      id, drawing_request_id, pdf_url, notes, status, created_at, responded_at,
      drawing_requests ( id, file_url, notes, users (full_name) )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
}

export async function createQuotation({ drawingRequestId, vendorId, companyId, pdfUrl, notes }) {
  return await supabase
    .from('quotations')
    .insert([{
      drawing_request_id: drawingRequestId,
      vendor_id: vendorId,
      company_id: companyId,
      pdf_url: pdfUrl,
      notes,
      status: 'submitted'
    }])
    .select()
}

export async function updateQuotation(id, { pdfUrl, notes, status }) {
  const updates = {};
  if (pdfUrl !== undefined) updates.pdf_url = pdfUrl;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  return await supabase
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
}

export async function deleteQuotation(id) {
  return await supabase.from('quotations').delete().eq('id', id)
}
