
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createJWT } from "npm:@vonage/jwt"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientId } = await req.json()
    
    if (!recipientId) {
      throw new Error('Recipient ID is required')
    }

    const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY')
    const applicationId = Deno.env.get('VONAGE_APPLICATION_ID')

    if (!privateKey || !applicationId) {
      throw new Error('Vonage credentials not configured')
    }

    // Generate a JWT token for the client SDK
    const token = createJWT(
      privateKey,
      {
        application_id: applicationId,
        sub: "chat",
        exp: Math.round(new Date().getTime() / 1000) + 86400, // 24 hours
        acl: {
          paths: {
            "/*/users/**": {},
            "/*/conversations/**": {},
            "/*/sessions/**": {}
          }
        }
      }
    )

    return new Response(
      JSON.stringify({ 
        token,
        applicationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating Vonage session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
