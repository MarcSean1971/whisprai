
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
    const { sessionId, recipientId, ncco } = await req.json()
    
    if (!sessionId || !recipientId || !ncco) {
      throw new Error('Missing required parameters')
    }

    const vonage = new Vonage({
      applicationId: Deno.env.get('VONAGE_APPLICATION_ID'),
      privateKey: Deno.env.get('VONAGE_PRIVATE_KEY')
    })
    
    // In a real-world scenario, you'd look up the phone number associated with the recipientId
    // For now, we'll use a placeholder approach
    
    // Create a call using the Vonage Voice API
    // Note: This requires a real phone number or SIP endpoint in production
    const callId = `test-call-${Date.now()}`
    
    console.log('Creating call with session ID:', sessionId)
    console.log('Recipient ID:', recipientId)
    console.log('NCCO:', ncco)

    // In production, you would use:
    /*
    const result = await vonage.voice.createCall({
      to: [{ type: 'phone', number: phoneNumber }],
      from: { type: 'phone', number: fromNumber },
      ncco: ncco
    })
    */

    return new Response(
      JSON.stringify({ 
        callId,
        status: 'initiated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating Vonage call:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
