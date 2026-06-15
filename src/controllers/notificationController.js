import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useVendor } from '../context/VendorContext'
import { getDrawingsByCompany } from '../models/drawingModel'
import { useRealtimeChannel } from '../hooks/useRealtimeChannel'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

// Module-level Set to deduplicate realtime events across multiple hook instances
const processedEventIds = new Set()

export function useNotifications() {
  const navigate = useNavigate()
  const { vendorProfile } = useVendor()
  const companyId = vendorProfile?.company_id
  const vendorId = vendorProfile?.id
  const queryClient = useQueryClient()

  // Track read notification IDs locally
  const [readIds, setReadIds] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage when vendorId becomes available and listen for cross-component changes
  useEffect(() => {
    if (!vendorId) return;

    const loadStorage = () => {
      try {
        const saved = localStorage.getItem(`read_notifications_${vendorId}`)
        if (saved) {
          setReadIds(JSON.parse(saved))
        }
      } catch (e) {
        console.error("Failed to load read notifications", e)
      }
      setIsLoaded(true)
    };

    loadStorage();

    const handleStorage = () => loadStorage();
    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, [vendorId])

  // Save to localStorage when updated, but only after initial load
  useEffect(() => {
    if (vendorId && isLoaded) {
      localStorage.setItem(`read_notifications_${vendorId}`, JSON.stringify(readIds))
    }
  }, [readIds, vendorId, isLoaded])

  const { data: rawDrawings = [], isLoading } = useQuery({
    queryKey: ['drawings', companyId],
    queryFn: async () => {
      const { data, error } = await getDrawingsByCompany(companyId)
      if (error) throw error
      return data || []
    },
    enabled: !!companyId
  })

  // Map drawing requests to a notification format, using readIds for state
  const notifications = rawDrawings.map(d => ({
    id: d.id,
    type: 'request',
    title: 'New Drawing Request',
    body: d.notes || 'A new request has been assigned to your company.',
    created_at: d.created_at,
    is_read: d.status !== 'pending' || readIds.includes(d.id),
    link: `/drawings/${d.id}`
  }))

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Realtime listener for drawing requests
  useRealtimeChannel(
    `vendor_drawing_requests_${companyId}`,
    'drawing_requests',
    `company_id=eq.${companyId}`,
    async (payload) => {
      if (payload.eventType === 'INSERT') {
        const eventId = payload.new.id;
        
        // Prevent duplicate toasts and queries if multiple components use this hook
        if (!processedEventIds.has(eventId)) {
          processedEventIds.add(eventId);
          if (processedEventIds.size > 50) {
            processedEventIds.delete(processedEventIds.values().next().value);
          }

          toast.info(`New Drawing Request Received!`, { 
            position: 'top-right',
            autoClose: 5000,
            icon: '🔔',
            onClick: () => navigate(`/drawings/${payload.new.id}`)
          })
          
          queryClient.invalidateQueries(['drawings', companyId])
        }
      }
    }
  )

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      setReadIds(prev => [...prev, id])
    }
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(allIds)
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead
  }
}

