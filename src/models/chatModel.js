import { supabase } from './supabaseClient'

// Fetch all chats for a vendor's company
export async function getChatsByCompany(companyId) {
  return await supabase
    .from('chats')
    .select(`
      *,
      users(full_name, email),
      messages(vendor_unread_message_count, real_messages)
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })
}

// Fetch messages for a specific chat
export async function getChatMessages(chatId) {
  return await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
}

// Send a new message from the vendor
export async function sendVendorMessage(chatId, companyId, text) {
  // 1. Fetch existing messages row
  const { data: existingRows, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (fetchError) throw fetchError

  const newRealMessage = {
    who: companyId,
    message: text,
    timestamp: new Date().toISOString()
  }

  let messageData

  if (existingRows && existingRows.length > 0) {
    const existingRow = existingRows[0]
    const realMessages = existingRow.real_messages || []
    const currentUnread = existingRow.user_unread_message_count || 0
    
    const { data: updateData, error: updateError } = await supabase
      .from('messages')
      .update({
        real_messages: [...realMessages, newRealMessage],
        is_read_user: false,
        user_unread_message_count: currentUnread + 1
      })
      .eq('id', existingRow.id)
      .select()
      .single()

    if (updateError) throw updateError
    messageData = updateData
  } else {
    // 1. Insert message
    const { data: insertData, error: insertError } = await supabase
      .from('messages')
      .insert([{
        chat_id: chatId,
        is_read_vendor: true, // Vendor just sent it, so vendor has read the chat
        vendor_unread_message_count: 0,
        is_read_user: false,
        user_unread_message_count: 1,
        real_messages: [newRealMessage]
      }])
      .select()
      .single()

    if (insertError) throw insertError
    messageData = insertData
  }

  // 2. Update chat updated_at
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', chatId)
    .select()
    .single()

  if (chatError) throw chatError

  return { message: messageData, chat: chatData }
}

// Mark messages as read for vendor
export async function markMessagesAsReadForVendor(chatId) {
  // Update specific messages
  return await supabase
    .from('messages')
    .update({ 
      is_read_vendor: true,
      vendor_unread_message_count: 0
    })
    .eq('chat_id', chatId)
    .eq('is_read_vendor', false)
}

// Get existing chat or create a new one between company and user
export async function getOrCreateChat(companyId, userId) {
  // Check if chat exists
  const { data: existingChats, error: fetchError } = await supabase
    .from('chats')
    .select('*, users(full_name, email)')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .limit(1)

  if (fetchError) throw fetchError

  if (existingChats && existingChats.length > 0) {
    return existingChats[0]
  }

  // Create new chat
  const { data: newChat, error: insertError } = await supabase
    .from('chats')
    .insert([{
      company_id: companyId,
      user_id: userId,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (insertError) throw insertError

  return newChat
}
