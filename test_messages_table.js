import { createClient } from '@supabase/supabase-js'

const url = 'https://iuhmswsjzqrxpvgravfi.supabase.co'
const key = 'sb_publishable_s1LvK7XiT-YOkv7v1HMFGw_s8vNT6V0'

const supabase = createClient(url, key)

async function checkMessagesTable() {
  try {
    // 1. Fetch one row from messages
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.error('Error fetching messages:', fetchError)
      process.exit(1)
    }

    console.log('Messages columns:', messages && messages.length > 0 ? Object.keys(messages[0]) : 'no messages')
    if (messages && messages.length > 0) {
      console.log('Sample message:', messages[0])
    }

    // 2. Fetch one row from chats
    const { data: chats, error: fetchChatError } = await supabase
      .from('chats')
      .select('*')
      .limit(1)

    if (fetchChatError) {
      console.error('Error fetching chats:', fetchChatError)
      process.exit(1)
    }

    console.log('Chats columns:', chats && chats.length > 0 ? Object.keys(chats[0]) : 'no chats')
    if (chats && chats.length > 0) {
      console.log('Sample chat:', chats[0])
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
  process.exit(0)
}

checkMessagesTable()
