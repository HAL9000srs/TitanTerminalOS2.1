
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase client with Admin context (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get the user from the authorization header (Invoking User)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 3. Verify the invoking user is an ADMIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admins Only' }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 4. Parse request body
    const { email, password, displayName } = await req.json()

    if (!email || !password || !displayName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 5. Create the new user (Auto-confirmed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: { display_name: displayName }
    })

    if (createError) throw createError

    // 6. Create Profile Entry
    if (newUser.user) {
        const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                display_name: displayName,
                role: 'OPERATOR',
                access_key: '******'
            })
        
        if (updateProfileError) {
             console.error("Profile update failed", updateProfileError)
        }
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    )
  }
})
