import { supabase } from './src/models/supabaseClient.js';

async function test() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
  process.exit(0);
}

test();
