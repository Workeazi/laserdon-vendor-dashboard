import { useState, useEffect } from 'react'
import { supabase } from '../models/supabaseClient'
import { useVendor } from '../context/VendorContext'
import { getChatsByCompany, getChatMessages, sendVendorMessage, markMessagesAsReadForVendor, getOrCreateChat } from '../models/chatModel'

export function useChats() {
  const { vendorProfile } = useVendor()
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchChats = async () => {
    if (!vendorProfile?.company_id) {
      setIsLoading(false)
      return
    }
    try {
      const { data, error } = await getChatsByCompany(vendorProfile.company_id)
      if (error) throw error
      setChats(data || [])
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChats()

    if (vendorProfile?.company_id) {
      const channel = supabase.channel(`public:chats:company_${vendorProfile.company_id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chats', filter: `company_id=eq.${vendorProfile.company_id}` },
          (payload) => {
            fetchChats()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [vendorProfile?.company_id])

  const startNewChat = async (userId) => {
    if (!vendorProfile?.company_id) return null
    try {
      const chat = await getOrCreateChat(vendorProfile.company_id, userId)
      await fetchChats() // Refresh the list
      return chat
    } catch (error) {
      console.error('Error starting new chat:', error)
      throw error
    }
  }

  return { chats, isLoading, refetch: fetchChats, startNewChat }
}

export function useChatMessages(chatId, onMarkAsRead) {
  const { vendorProfile } = useVendor()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMessages = async () => {
    if (!chatId) {
      setIsLoading(false)
      return
    }
    try {
      const { data, error } = await getChatMessages(chatId)
      if (error) throw error
      
      let fetchedMessages = []
      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.real_messages && row.real_messages.length > 0) {
            const msgs = row.real_messages.map((m, idx) => ({
              id: `real_msg_${row.id}_${idx}`,
              text: m.message,
              is_vendor: m.who === vendorProfile?.company_id,
              created_at: m.timestamp || row.created_at 
            }))
            fetchedMessages.push(...msgs)
          } else if (row.text) {
            fetchedMessages.push({
              id: row.id,
              text: row.text,
              is_vendor: row.is_vendor,
              created_at: row.created_at
            })
          }
        })
      }
      
      // Sort messages by created_at ascending so newest are at the bottom
      fetchedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setMessages(fetchedMessages)

      // Mark as read when fetching
      await markMessagesAsReadForVendor(chatId)
      if (onMarkAsRead) {
        onMarkAsRead()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMessages([])
    setIsLoading(true)
    fetchMessages()

    if (chatId) {
      const channel = supabase.channel(`public:messages:${chatId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          (payload) => {
            fetchMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [chatId, vendorProfile?.company_id])

  const sendMessage = async (text) => {
    try {
      await sendVendorMessage(chatId, vendorProfile.company_id, text)
      await fetchMessages() // Force UI update immediately
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return { messages, isLoading, sendMessage, refetch: fetchMessages }
}
