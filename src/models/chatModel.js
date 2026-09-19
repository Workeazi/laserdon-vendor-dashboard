import { supabase } from './supabaseClient'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuhmswsjzqrxpvgravfi.supabase.co'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY_HERE'
// Fetch all chats for a vendor's company
export async function getChatsByCompany(companyId) {
  return await supabase
    .from('chats')
    .select(`
      *,
      users(full_name, email),
      messages(created_at, vendor_unread_message_count, real_messages)
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
export async function sendVendorMessage(chatId, companyId, text, replyTo = null, attachment = null) {
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

  if (replyTo) {
    newRealMessage.replyTo = replyTo
  }

  let messageData

  // If there is an attachment, force creating a new row
  if (existingRows && existingRows.length > 0 && !attachment) {
    const existingRow = existingRows[0]
    let realMessages = existingRow.real_messages || []
    if (typeof realMessages === 'string') {
      try {
        realMessages = JSON.parse(realMessages)
      } catch (e) {
        realMessages = [{ message: realMessages }]
      }
    }
    if (Array.isArray(realMessages)) {
      realMessages = realMessages.map(m => typeof m === 'string' ? { message: m } : m).filter(m => m !== null);
    }
    const currentUnread = existingRow.user_unread_message_count || 0
    
        const response = await fetch(`/supabase-api/rest/v1/messages?id=eq.${existingRow.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        real_messages: [...realMessages, newRealMessage],
        is_read_user: false,
        user_unread_message_count: currentUnread + 1
      })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    let updateData = data[0];
    let updateError = null;

    if (updateError) throw updateError
    messageData = updateData
  } else {
    // 1. Insert message
        // Use Vite proxy to bypass Supabase CORS Origin blocks for Service Key
    const response = await fetch(`/supabase-api/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        chat_id: chatId,
        vendor_unread_message_count: 0,
        is_read_user: false,
        user_unread_message_count: 1,
        real_messages: [newRealMessage],
        has_attachment: attachment ? true : false,
        attachment_name: attachment ? attachment.name : null,
        attachment_ref_id: attachment ? attachment.url : null
      })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    let insertData = data[0];
    let insertError = null;

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
  const { error } = await supabase
    .from('messages')
    .update({ 
      vendor_unread_message_count: 0
    })
    .eq('chat_id', chatId)
    
  if (error) throw error;
  
  // Update chat so realtime listeners (like Sidebar) pick up the read status
  return await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId)
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

// Delete an entire chat and all its messages (clear chat for vendor only)
export async function deleteChat(chatId) {
  // Instead of deleting the chat, mark all messages as deletedForVendor
  const { data: messagesRows, error: fetchError } = await supabase
    .from('messages')
    .select('id, real_messages')
    .eq('chat_id', chatId)
    
  if (fetchError) throw fetchError

  if (messagesRows && messagesRows.length > 0) {
    for (const row of messagesRows) {
      let messages = row.real_messages
      if (typeof messages === 'string') {
        try {
          messages = JSON.parse(messages)
        } catch (e) {
          messages = [{ message: messages }]
        }
      }
      
      let parsedArray = []
      if (Array.isArray(messages)) {
        let chars = [];
        let other = [];
        messages.forEach(m => {
          if (typeof m === 'string' && m.length === 1) chars.push(m);
          else if (typeof m === 'string') other.push({ message: m });
          else if (m !== null) other.push(m);
        });
        if (chars.length > 0) {
          const joined = chars.join('');
          try {
             const parsed = JSON.parse(joined);
             if (Array.isArray(parsed)) other.unshift(...parsed);
             else other.unshift(parsed);
          } catch(e) {
             other.unshift({ message: joined });
          }
        }
        parsedArray = other;
      } else {
        parsedArray = [messages]
      }
      
      const newRealMessages = parsedArray.map(m => ({
        ...m,
        deletedForVendor: true
      }))
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ real_messages: newRealMessages })
        .eq('id', row.id)
        
      if (updateError) throw updateError
    }
  }
  
  return true
}

// Delete a specific message within a chat row
export async function deleteMessage(rowId, messageIndex, deleteType) {
  const { data: row, error: fetchError } = await supabase
    .from('messages')
    .select('real_messages')
    .eq('id', rowId)
    .single()

  if (fetchError) throw fetchError

  let messages = row.real_messages
  if (typeof messages === 'string') {
    try {
      messages = JSON.parse(messages)
    } catch (e) {
      messages = [{ message: messages }]
    }
  }
  
  let parsedArray = []
  if (Array.isArray(messages)) {
    let chars = [];
    let other = [];
    messages.forEach(m => {
      if (typeof m === 'string' && m.length === 1) chars.push(m);
      else if (typeof m === 'string') other.push({ message: m });
      else if (m !== null) other.push(m);
    });
    
    if (chars.length > 0) {
      const joined = chars.join('');
      try {
         const parsed = JSON.parse(joined);
         if (Array.isArray(parsed)) other.unshift(...parsed);
         else other.unshift(parsed);
      } catch(e) {
         other.unshift({ message: joined });
      }
    }
    parsedArray = other;
  } else {
    parsedArray = [messages]
  }

  if (messageIndex >= 0 && messageIndex < parsedArray.length) {
    const msg = parsedArray[messageIndex]
    if (deleteType === 'me') {
      msg.deletedForVendor = true
    } else if (deleteType === 'everyone') {
      msg.message = "🚫 This message was deleted"
      msg.is_deleted = true
    }
  }

  const { error: updateError } = await supabase
    .from('messages')
    .update({ real_messages: parsedArray })
    .eq('id', rowId)

  if (updateError) throw updateError
  return true
}

