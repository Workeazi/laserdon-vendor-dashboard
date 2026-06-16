import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDrawingById } from '../../controllers/drawingController'
import { useCreateQuotation, useQuotations, useUpdateQuotation } from '../../controllers/quotationController'
import { formatDate } from '../../utils/formatters'
import { supabase } from '../../models/supabaseClient'
import toast from 'react-hot-toast'
import { Download, Upload, CheckCircle } from 'lucide-react'

export default function DrawingDetailModal({ drawingId: propDrawingId, onClose }) {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const drawingId = propDrawingId || routeId
  
  const { data: drawing, isLoading } = useDrawingById(drawingId)
  const { data: quotations } = useQuotations()
  const { mutate: createQuotation, isPending: isCreating } = useCreateQuotation()
  const { mutate: updateQuotation, isPending: isUpdating } = useUpdateQuotation()

  const existingQuotation = quotations?.find(q => q.drawing_request_id === drawingId || q.drawing_requests?.id === drawingId)
  const isSubmitting = isCreating || isUpdating

  const [pdfFile, setPdfFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) return (
    <div className="p-8 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-32 w-full bg-gray-100 rounded-xl animate-pulse"></div>
    </div>
  )

  if (!drawing) return null

  const handleFileChange = (file) => {
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a valid PDF document.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File exceeds 10MB limit.');
        return;
      }
      setPdfFile(file);
    }
  }

  const handleSendQuote = async (e) => {
    e.preventDefault()
    
    if (!pdfFile) {
      toast.error('Please select a quotation PDF file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `quotations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('drawings')
        .getPublicUrl(filePath);

      const pdfUrl = publicUrlData?.publicUrl || filePath;

      if (isEditing && existingQuotation) {
        updateQuotation(
          { id: existingQuotation.id, data: { pdf_url: pdfUrl, notes } },
          {
            onSuccess: () => {
              toast.success('Quotation updated successfully!');
              setIsUploading(false);
              setIsEditing(false);
              setPdfFile(null);
            },
            onError: () => setIsUploading(false)
          }
        )
      } else {
        createQuotation(
          { drawingRequestId: drawing.id, pdfUrl, notes },
          {
            onSuccess: () => {
              toast.success('Quotation submitted successfully!');
              setIsUploading(false);
              if (onClose) {
                onClose();
              } else {
                navigate('/drawings');
              }
            },
            onError: () => setIsUploading(false)
          }
        )
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
      setIsUploading(false);
    }
  }

  const showForm = !existingQuotation || isEditing

  return (
    <div className="p-2 sm:p-4 font-body-md text-on-surface h-auto">
      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Column: Request Details */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Header Panel */}
          <section className="bg-white border border-gray-200 p-5 rounded-xl relative overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-gray-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-[20px] leading-[28px] font-semibold text-gray-900">
                    {drawing.users?.full_name || 'Unknown Customer'}
                  </h2>
                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {drawing.status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span className="text-xs">Received on {formatDate(drawing.created_at)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Request Notes */}
          {drawing.notes && (
            <section className="bg-white border border-gray-200 p-4 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-gray-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 rounded text-primary">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                </div>
                <h3 className="text-[16px] font-semibold">Request Notes</h3>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {drawing.notes}
                </p>
              </div>
            </section>
          )}

          {/* Attached Drawing */}
          <section className="bg-white border border-gray-200 p-4 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-gray-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-50 rounded text-green-700">
                  <span className="material-symbols-outlined text-[18px]">architecture</span>
                </div>
                <h3 className="text-[16px] font-semibold">Attached Drawing</h3>
              </div>
              <a 
                href={drawing.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] font-semibold hover:bg-gray-50 transition-all text-gray-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Requested by</p>
                <p className="text-xs font-semibold text-gray-900">{drawing.users?.full_name || 'Unknown'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Company</p>
                <p className="text-xs font-semibold text-gray-900">{drawing.companies?.name || 'Unknown'}</p>
              </div>
            </div>

            {/* File Preview Area */}
            {drawing.file_url?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
                <img src={drawing.file_url} alt={drawing.file_name} className="max-w-full max-h-[160px] object-contain rounded-lg shadow-sm" />
              </div>
            ) : null}
          </section>
        </div>

        {/* Right Column: Quotation Panel */}
        <div className="col-span-12 lg:col-span-4">
          {showForm ? (
            <section className="bg-white border border-primary/20 p-4 rounded-xl shadow-sm relative overflow-hidden h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-semibold">{isEditing ? 'Update Quotation' : 'Submit Quotation'}</h3>
                {isEditing && (
                  <button type="button" onClick={() => setIsEditing(false)} className="text-[11px] text-gray-500 hover:text-gray-800 underline font-semibold">Cancel</button>
                )}
              </div>
              <form onSubmit={handleSendQuote} className="space-y-4 relative z-10 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600">Quotation Document (PDF)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleFileChange(e.dataTransfer.files[0]);
                    }}
                    className={`py-6 px-4 flex flex-col items-center justify-center text-center rounded-xl transition-all cursor-pointer border-2 ${
                      isDragOver ? 'border-primary bg-primary/5' : 
                      pdfFile ? 'border-green-400 bg-green-50' : 
                      'border-gray-300 border-dashed hover:bg-gray-50'
                    }`}
                  >
                    {pdfFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                        <p className="text-xs font-semibold text-green-700 truncate max-w-[160px]">{pdfFile.name}</p>
                        <button type="button" onClick={(e) => { e.preventDefault(); setPdfFile(null); }} className="text-[10px] text-green-600 font-bold hover:text-green-800 mt-1 underline">Remove file</button>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <Upload className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700">
                          <label htmlFor="file-upload" className="text-primary hover:underline cursor-pointer">
                            Upload
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="application/pdf" onChange={(e) => handleFileChange(e.target.files[0])} />
                          </label> or drag & drop
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">PDF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600">Terms & Notes (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" 
                    placeholder="Add terms or timeline details..." 
                    rows="2"
                  />
                </div>

                <div className="mt-auto pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isUploading || !pdfFile}
                    className="w-full bg-primary hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting || isUploading ? (
                      <span className="flex items-center gap-2 text-xs">
                         <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        {isEditing ? 'Update Quote' : 'Send Official Quote'}
                      </span>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-medium text-gray-500 mt-2">
                    A copy will be emailed to {drawing.users?.full_name || 'the customer'}.
                  </p>
                </div>
              </form>
            </section>
          ) : (
            <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center shadow-sm h-full flex flex-col justify-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-[16px] font-bold text-gray-900">
                {drawing?.status === 'approved' ? 'Quotation Approved' : 'Quotation Submitted'}
              </h3>
              <p className="text-gray-600 text-xs mt-1 mb-4">
                {drawing?.status === 'approved' 
                  ? 'The customer has approved this quotation. It can no longer be edited.' 
                  : 'You have already submitted a quote for this request.'}
              </p>

              <div className="bg-white rounded-lg p-3 border border-green-200 text-left mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Document</span>
                  <a href={existingQuotation.pdf_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
                    <Download className="w-3 h-3" /> View PDF
                  </a>
                </div>
                {existingQuotation.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Notes</span>
                    <p className="text-[11px] text-gray-700">{existingQuotation.notes}</p>
                  </div>
                )}
              </div>

              {drawing?.status !== 'approved' && (
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setNotes(existingQuotation.notes || '');
                  }}
                  className="mx-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit Quotation
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
