
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Vonage } from 'npm:@vonage/server-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, userId } = await req.json()
    
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID are required')
    }

    const vonage = new Vonage({
      applicationId: Deno.env.get('VONAGE_APPLICATION_ID'),
      privateKey: Deno.env.get('VONAGE_PRIVATE_KEY')
    })

    // Generate a token for the user
    const token = await vonage.voice.generateToken(sessionId, {
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      sub: userId,
    })

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating Vonage token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
