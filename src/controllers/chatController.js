import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../models/supabaseClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cqcxcjadqlwajmznxnzx.supabase.co'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY_HERE'

import { useVendor } from '../context/VendorContext'
import { getChatsByCompany, getChatMessages, sendVendorMessage, markMessagesAsReadForVendor, getOrCreateChat, deleteChat } from '../models/chatModel'
import toast from 'react-hot-toast'

export function useChats(enableNotifications = false) {
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
      const channelId = `public:chats:company_${vendorProfile.company_id}_${Math.random().toString(36).substring(7)}`
      const channel = supabase.channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chats', filter: `company_id=eq.${vendorProfile.company_id}` },
          (payload) => {
            fetchChats()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
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

  const removeChat = async (chatId) => {
    try {
      await deleteChat(chatId)
      await fetchChats() // Refresh the list after deletion
      return true
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  const totalUnreadMessages = chats.reduce((total, chat) => {
    if (!chat.messages || chat.messages.length === 0) return total;
    let chatUnread = 0;
    chat.messages.forEach(msgRow => {
      let unreadCount = msgRow.vendor_unread_message_count;
      if (unreadCount === null || unreadCount === undefined) {
         unreadCount = 1;
      }
      chatUnread += unreadCount;
    });
    return total + chatUnread;
  }, 0)

  const isInitialLoad = useRef(true)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)

  useEffect(() => {
    if (!enableNotifications) return; // Prevent double notifications if hook used in multiple components

    if (isInitialLoad.current) {
      if (!isLoading) {
        isInitialLoad.current = false
        setPrevUnreadCount(totalUnreadMessages)
      }
      return
    }

    if (totalUnreadMessages > prevUnreadCount) {
      const now = Date.now();
      const lastPlayed = parseInt(sessionStorage.getItem('lastNotificationSound') || '0', 10);
      if (now - lastPlayed > 2000) {
        sessionStorage.setItem('lastNotificationSound', now.toString());
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
          audio.play().catch(e => console.log('Audio play failed', e))
        } catch (e) {}
        
        toast('New message from customer!', {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#111b21',
            color: '#e9edef',
            border: '1px solid #2a3942'
          },
          duration: 4000
        })
      }
    }
    setPrevUnreadCount(totalUnreadMessages)
  }, [totalUnreadMessages, isLoading, prevUnreadCount, enableNotifications])

  return { chats, isLoading, refetch: fetchChats, startNewChat, removeChat, totalUnreadMessages }
}

export function useChatMessages(chatId, onMarkAsRead) {
  const { vendorProfile } = useVendor()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const activeChatRef = useRef(chatId)

  useEffect(() => {
    activeChatRef.current = chatId
  }, [chatId])

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
        data.forEach((row, rowIdx) => {
          let realMessages = row.real_messages;
          if (typeof realMessages === 'string') {
            try {
              realMessages = JSON.parse(realMessages);
            } catch (e) {
              realMessages = [{ message: realMessages }];
            }
          }
          if (Array.isArray(realMessages)) {
            realMessages = realMessages.map(m => typeof m === 'string' ? { message: m } : m).filter(m => m !== null);
          }
          
          if (realMessages && realMessages.length > 0) {
            const msgs = realMessages.map((m, idx) => { const is_vendor = String(m.who) === String(vendorProfile?.company_id); return {
              id: `real_msg_${row.id}_${idx}`,
              text: m.message,
              is_vendor: String(m.who) === String(vendorProfile?.company_id),
              created_at: m.timestamp || row.created_at,
              sequence: rowIdx * 1000000 + idx,
              has_attachment: ((idx === 0) ? row.has_attachment : false) || !!m.attachment,
              attachment_name: m.attachment ? m.attachment.name : ((idx === 0) ? row.attachment_name : null),
              attachment_ref_id: m.attachment ? m.attachment.url : ((idx === 0) ? row.attachment_ref_id : null),
              replyTo: m.replyTo || null,
              deletedForVendor: m.deletedForVendor || false,
              isDeleted: m.isDeleted || m.is_deleted || false
            }; }).filter(m => !m.deletedForVendor) // Filter out deleted for vendor
            fetchedMessages.push(...msgs)
          } else if (row.text) {
            fetchedMessages.push({
              id: row.id,
              text: row.text,
              is_vendor: row.is_vendor,
              created_at: row.created_at,
              sequence: rowIdx * 1000000
            })
          }
        })
      }
      
      // Sort messages by sequence ascending to preserve original array order
      fetchedMessages.sort((a, b) => a.sequence - b.sequence);
      
      // Prevent race condition: only update state if we are still on the same chat
      if (chatId === activeChatRef.current) {
        setMessages(fetchedMessages)
        setIsLoading(false)
      }

      // Mark as read when fetching ONLY if there are unread messages
      // to prevent an infinite loop with realtime listeners
      const hasUnread = data && data.some(row => row.vendor_unread_message_count === null || row.vendor_unread_message_count > 0);
      if (hasUnread) {
        // Fire and forget, don't await to block the UI
        markMessagesAsReadForVendor(chatId).then(() => {
          if (onMarkAsRead) {
            onMarkAsRead()
          }
        }).catch(err => console.error(err))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      if (chatId === activeChatRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    setMessages([])
    setIsLoading(true)
    fetchMessages()

    if (chatId) {
      const channelId = `public:messages:${chatId}_${Math.random().toString(36).substring(7)}`
      const channel = supabase.channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          (payload) => {
            // Check if it's a new unread message (even if we are about to mark it read)
            if (payload.new && payload.new.vendor_unread_message_count > 0) {
              const now = Date.now();
              const lastPlayed = parseInt(sessionStorage.getItem('lastNotificationSound') || '0', 10);
              if (now - lastPlayed > 2000) {
                sessionStorage.setItem('lastNotificationSound', now.toString());
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                  audio.play().catch(e => console.log('Audio play failed', e))
                } catch (e) {}
              }
            }
            fetchMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [chatId, vendorProfile?.company_id])

  const sendMessage = async (text, replyToData = null, attachmentFile = null) => {
    try {
      let attachment = null;
      
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${chatId}/${fileName}`;
        
        // Use Vite proxy to bypass Supabase CORS Origin blocks for Service Key
        const uploadResponse = await fetch(`/supabase-api/storage/v1/object/chat_attachments/${filePath}`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': attachmentFile.type || 'application/octet-stream'
          },
          body: attachmentFile
        });
        if (!uploadResponse.ok) throw new Error(await uploadResponse.text());
        
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/chat_attachments/${filePath}`;
        
        attachment = {
          name: attachmentFile.name,
          url: publicUrl
        };
      }
      
      await sendVendorMessage(chatId, vendorProfile.company_id, text, replyToData, attachment)
      await fetchMessages() // Force UI update immediately
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const deleteMsg = async (msgId, deleteType) => {
    try {
      // msgId format: real_msg_{rowId}_{idx}
      const match = msgId.match(/^real_msg_(.+)_(.+)$/)
      if (match) {
        const rowId = match[1]
        const idx = parseInt(match[2], 10)
        await import('../models/chatModel').then(m => m.deleteMessage(rowId, idx, deleteType))
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  return { messages, isLoading, sendMessage, deleteMsg, refetch: fetchMessages }
}
