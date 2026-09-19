import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cqcxcjadqlwajmznxnzx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aG1zd3NqenFyeHB2Z3JhdmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjA5MzIsImV4cCI6MjA5NjYzNjkzMn0.WV3KiT98CC4geijhVwswDaF56scsb72-h9tuogk-6nI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
