import { supabase } from './src/models/supabaseClient.js'

async function checkSchema() {
  const { data: vendor } = await supabase.from('vendors').select('*').limit(1)
  const { data: company } = await supabase.from('companies').select('*').limit(1)
  
  console.log('Vendors columns:', vendor && vendor.length > 0 ? Object.keys(vendor[0]) : 'no vendors')
  console.log('Companies columns:', company && company.length > 0 ? Object.keys(company[0]) : 'no companies')
  process.exit(0)
}

checkSchema()
