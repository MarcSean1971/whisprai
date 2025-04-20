
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
    const { callId } = await req.json()
    
    if (!callId) {
      throw new Error('Call ID is required')
    }

    const vonage = new Vonage({
      applicationId: Deno.env.get('VONAGE_APPLICATION_ID'),
      privateKey: Deno.env.get('VONAGE_PRIVATE_KEY')
    })
    
    console.log('Ending call with ID:', callId)
    
    // In production, you would use:
    /*
    await vonage.voice.updateCall(callId, { action: 'hangup' })
    */

    return new Response(
      JSON.stringify({ 
        status: 'ended'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error ending Vonage call:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
