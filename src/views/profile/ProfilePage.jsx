import React, { useState, useEffect } from 'react'
import { useVendorProfile } from '../../controllers/profileController'
import FileDropzone from '../../components/ui/FileDropzone'
import { Save, CheckCircle, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { profile, isSaving, updateProfile, updateCompany, uploadDocument, uploadProfileImage } = useVendorProfile()

  const [formData, setFormData] = useState({
    company_name: '', email: '', phone: '', office_address: '', gst_number: ''
  })
  
  const [localProfileImage, setLocalProfileImage] = useState(() => localStorage.getItem(`vendor_profile_image_${profile?.id}`) || null)

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile?.companies?.short_name || profile.username || '',
        email: profile.email || '',
        phone: profile.alt_phone || profile.whatsapp_number || profile.phone || '',
        office_address: profile?.companies?.company_address || profile.office_address || '',
        gst_number: profile?.companies?.company_gst_number || profile.gst_number || ''
      })
    }
  }, [profile])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Split formData to match the new schema
    const { company_name, phone, email, office_address, gst_number } = formData;
    
    // Valid vendor columns: username, email, whatsapp_number, alt_phone
    updateProfile({ alt_phone: phone })
    
    if (profile?.company_id) {
      updateCompany({ 
        companyId: profile.company_id, 
        data: { 
          short_name: company_name,
          company_address: office_address,
          company_gst_number: gst_number
        } 
      })
    }
  }

  const handleDocumentUpload = async (file) => {
    const toastId = toast.loading(`Uploading ${file.name}...`)
    try {
      const data = await uploadDocument(file)
      if (data) {
        toast.success(`${file.name} uploaded successfully!`, { id: toastId })
      } else {
        toast.error('Failed to upload document.', { id: toastId })
      }
    } catch (err) {
      toast.error('An error occurred during upload.', { id: toastId })
    }
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading('Uploading image...')
    try {
      // Use company_id if available, otherwise vendor's id
      const targetId = profile?.company_id || profile?.id
      const uploadRes = await uploadProfileImage(file, targetId)
      
      if (uploadRes?.publicUrl) {
        if (profile?.company_id) {
          await updateCompany({ companyId: profile.company_id, data: { company_profile_image: uploadRes.publicUrl } })
        } else if (profile?.id) {
          localStorage.setItem(`vendor_profile_image_${profile.id}`, uploadRes.publicUrl)
        }
        setLocalProfileImage(uploadRes.publicUrl)
        window.dispatchEvent(new Event('profileImageUpdated'))
        toast.success('Profile image updated', { id: toastId })
      } else {
        toast.error('Failed to upload image', { id: toastId })
      }
    } catch (err) {
      toast.error('Error updating image', { id: toastId })
    }
  }

  if (!profile) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading profile...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Business Profile</h2>

      {(!profile?.document_status || profile?.document_status === 'pending') && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="material-symbols-outlined text-yellow-600">warning</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-yellow-800">Action Required: Upload Documents</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your login has been approved, but your public company profile is not active yet. Please upload your business documents below for admin verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.document_status === 'uploaded' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="material-symbols-outlined text-blue-600">info</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-blue-800">Documents Under Review</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your uploaded documents are currently being verified by the admin team. We will activate your company profile once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.document_status === 'rejected' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="material-symbols-outlined text-red-600">error</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800">Documents Rejected</h3>
              <p className="text-sm text-red-700 mt-1">
                Your previously uploaded documents were rejected. Please ensure they meet the requirements and re-upload them to proceed.
              </p>
            </div>
          </div>
        </div>
      )}

      {(profile?.document_status === 'verified' || profile?.document_status === 'approved') && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-green-800">Documents Verified & Profile Active</h3>
              <p className="text-sm text-green-700 mt-1">
                Your documents have been approved and your company profile is now active on the marketplace!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">General Information</h3>
            <p className="text-xs text-gray-500">Update your company details and contact information.</p>
          </div>
          {profile?.companies?.is_verified && (
            <span className="flex items-center text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verified Vendor
            </span>
          )}
        </div>
        
        <div className="p-6 border-b border-gray-100 flex items-center gap-6">
          <div className="relative group">
            <img 
              src={localProfileImage || profile?.companies?.company_profile_image || `https://ui-avatars.com/api/?name=${profile?.companies?.short_name || profile.username || 'Vendor'}&background=random`} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6" />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={isSaving} />
            </label>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-lg">Company Profile Image</h4>
            <p className="text-sm text-gray-500 mb-2">JPG, GIF or PNG. Max size of 800K</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand uppercase" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
              <textarea name="office_address" value={formData.office_address} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand" rows="2" />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-800">Business Documents</h3>
          <p className="text-xs text-gray-500">Upload your GST certificate or business registration docs.</p>
        </div>
        <div className="p-6">
          {(profile?.document_status === 'uploaded' || profile?.document_status === 'approved' || profile?.document_status === 'verified') ? (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h4 className="font-medium text-gray-800">Document Uploaded</h4>
                  <p className="text-xs text-gray-500">Your documents have been securely uploaded.</p>
                </div>
              </div>
              <div className="relative">
                <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit
                </button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload(file);
                  }}
                />
              </div>
            </div>
          ) : (
            <FileDropzone 
              onDrop={handleDocumentUpload} 
              accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }} 
            />
          )}
        </div>
      </div>
    </div>
  )
}
