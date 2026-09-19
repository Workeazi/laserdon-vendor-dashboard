import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Hash the incoming password with SHA-256 (matches frontend logic)
    const msgBuffer = new TextEncoder().encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 2. Query the vendors table using Service Role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: vendor, error } = await supabaseClient
      .from('vendors')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !vendor) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    if (vendor.password_hash !== passwordHash) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // You can uncomment this if you only want approved vendors to login
    /*
    if (vendor.status !== 'approved') {
      return new Response(JSON.stringify({ error: "Account not approved or active" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      })
    }
    */

    // 3. Forcefully confirm the user's email using the Admin API
    const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
      vendor.id,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error("Could not confirm user email:", confirmError)
    }

    // Return success to the client, telling it to run the native login
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
