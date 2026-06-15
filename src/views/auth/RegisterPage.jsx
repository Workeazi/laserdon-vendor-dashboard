import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../../utils/supabase'
import { useSession } from '../../hooks/useSession'
import { Hexagon } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

function MapCenterUpdater({ position }) {
  const map = useMap()
  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 15)
    }
  }, [position, map])
  return null
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: '',
    organisationName: '',
    gst: '',
    email: '',
    phoneNumber: '',
    isWhatsappSame: true,
    whatsappNumber: '',
    alternativePhoneNumber: '',
    industryType: '',
    officeAddress: '',
    password: '',
    confirmPassword: ''
  })
  
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { session } = useSession()

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.userName || formData.userName.length < 3) {
      newErrors.userName = "Name must be at least 3 characters."
    }
    
    if (!formData.organisationName || formData.organisationName.length < 2) {
      newErrors.organisationName = "Organisation name is required."
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required."
    }
    
    if (!formData.gst || formData.gst.length !== 15) {
      newErrors.gst = "GST Number must be 15 characters."
    }
    
    const checkPhone = (phone) => {
      const clean = phone.replace(/\D/g, '')
      return clean.length >= 10 && clean.length <= 15
    }
    
    if (!formData.phoneNumber || !checkPhone(formData.phoneNumber)) {
      newErrors.phoneNumber = "Valid phone number is required (min 10 digits)."
    }
    
    if (formData.alternativePhoneNumber && !checkPhone(formData.alternativePhoneNumber)) {
      newErrors.alternativePhoneNumber = "Invalid alternative phone number."
    }
    
    if (!formData.isWhatsappSame && (!formData.whatsappNumber || !checkPhone(formData.whatsappNumber))) {
      newErrors.whatsappNumber = "Valid WhatsApp number is required."
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number."
    } else if (!/(?=.*[a-zA-Z])/.test(formData.password)) {
      newErrors.password = "Password must contain at least one letter."
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match."
    }
    
    if (!formData.industryType) {
      newErrors.industryType = "Please select an industry type."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleGetLocation = (e) => {
    e.preventDefault()
    if ('geolocation' in navigator) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setPosition({ lat: latitude, lng: longitude })
          setLoading(false)
        },
        (err) => {
          alert("Could not fetch location. Please ensure location services are enabled.")
          setLoading(false)
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user account.")

      // 2. Hash password
      const msgBuffer = new TextEncoder().encode(formData.password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const companyName = formData.organisationName;
      const whatsappNumber = formData.isWhatsappSame ? formData.phoneNumber : formData.whatsappNumber;

      // 3. Create company first to get company_id
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ 
          short_name: companyName,
          company_address: formData.officeAddress || null,
          company_gst_number: formData.gst || null
        }])
        .select()
        .single()

      if (companyError) throw companyError

      const companyId = companyData.id

      // 4. Create vendor using the new schema
      const { error: dbError } = await supabase
        .from('vendors')
        .insert([
          {
            id: authData.user.id,
            username: formData.userName,
            email: formData.email,
            password_hash: passwordHash,
            company_id: companyId,
            status: 'pending',
            whatsapp_number: whatsappNumber,
            alt_phone: formData.phoneNumber || null
          }
        ])

      if (dbError) throw dbError

      // Redirect to login page with success message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Your account is pending admin approval. You will be able to login once approved.' 
        } 
      })
    } catch (error) {
      console.error('Error inserting vendor:', error)
      alert(error.message || 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="flex justify-center">
          <Hexagon className="w-16 h-16 text-brand" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vendor Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join LaserDon and manage your manufacturing requests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">User Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="userName"
                    required
                    value={formData.userName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.userName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.userName && <p className="mt-1 text-sm text-red-600">{errors.userName}</p>}
              </div>

              {/* Organisation Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Organisation Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="organisationName"
                    required
                    value={formData.organisationName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.organisationName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Acme Corp"
                  />
                </div>
                {errors.organisationName && <p className="mt-1 text-sm text-red-600">{errors.organisationName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="vendor@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* GST */}
              <div>
                <label className="block text-sm font-medium text-gray-700">GST Number</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="gst"
                    required
                    value={formData.gst}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.gst ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="GSTIN"
                  />
                </div>
                {errors.gst && <p className="mt-1 text-sm text-red-600">{errors.gst}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
              </div>

              {/* Alternative Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Alternative Phone Number</label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="alternativePhoneNumber"
                    value={formData.alternativePhoneNumber}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.alternativePhoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="+91 98765 43211"
                  />
                </div>
                {errors.alternativePhoneNumber && <p className="mt-1 text-sm text-red-600">{errors.alternativePhoneNumber}</p>}
              </div>

              {/* WhatsApp Checkbox */}
              <div className="sm:col-span-2 flex items-center h-full mt-2">
                <input
                  type="checkbox"
                  id="isWhatsappSame"
                  name="isWhatsappSame"
                  checked={formData.isWhatsappSame}
                  onChange={handleChange}
                  className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                />
                <label htmlFor="isWhatsappSame" className="ml-2 block text-sm text-gray-900">
                  Is WhatsApp number same as Phone Number?
                </label>
              </div>

              {/* Conditional WhatsApp Number */}
              {!formData.isWhatsappSame && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="whatsappNumber"
                      required={!formData.isWhatsappSame}
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm ${errors.whatsappNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.whatsappNumber && <p className="mt-1 text-sm text-red-600">{errors.whatsappNumber}</p>}
                </div>
              )}

              {/* Industry Type */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Industry Type</label>
                <div className="mt-1">
                  <select
                    name="industryType"
                    required
                    value={formData.industryType}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-brand focus:border-brand sm:text-sm bg-white ${errors.industryType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Industry Type</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="electronics">Electronics</option>
                    <option value="automotive">Automotive</option>
                    <option value="aerospace">Aerospace</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {errors.industryType && <p className="mt-1 text-sm text-red-600">{errors.industryType}</p>}
              </div>

              {/* Office Location Text */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Office Address</label>
                <div className="mt-1">
                  <textarea
                    name="officeAddress"
                    rows="2"
                    required
                    value={formData.officeAddress}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm"
                    placeholder="Enter full office address"
                  ></textarea>
                </div>
              </div>

              {/* Map Section */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Pin Office Location on Map</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-brand bg-brand/10 hover:bg-brand/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                  >
                    Use My Current Location
                  </button>
                </div>
                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm relative z-0">
                  <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                    <MapCenterUpdater position={position} />
                  </MapContainer>
                </div>
                {position && (
                  <p className="mt-2 text-xs text-green-600">
                    Location pinned: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                  </p>
                )}
                {!position && (
                  <p className="mt-2 text-xs text-gray-500">
                    Click on the map to pin your office location, or use the button above.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
