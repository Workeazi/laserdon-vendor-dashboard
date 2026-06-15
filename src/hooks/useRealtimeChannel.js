import { useEffect } from 'react'
import { supabase } from '../models/supabaseClient'

export function useRealtimeChannel(channelName, table, filter, callback) {
  useEffect(() => {
    if (!channelName || channelName.includes('undefined')) return;

    const uniqueChannelName = `${channelName}-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, table, filter, callback])
}
