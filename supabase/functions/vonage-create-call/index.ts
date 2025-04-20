
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

    // In a real implementation, we'd look up the phone number from the user profile
    // For now we'll use a test number from Vonage
    const fromNumber = Deno.env.get('VONAGE_VIRTUAL_NUMBER')
    const toNumber = Deno.env.get('VONAGE_TO_NUMBER') // This should be the recipient's number

    if (!fromNumber || !toNumber) {
      throw new Error('Phone numbers not configured')
    }

    console.log('Creating call from', fromNumber, 'to', toNumber)
    console.log('NCCO:', JSON.stringify(ncco, null, 2))

    const result = await vonage.voice.createCall({
      to: [{ 
        type: 'phone', 
        number: toNumber 
      }],
      from: { 
        type: 'phone', 
        number: fromNumber 
      },
      ncco: ncco
    })

    console.log('Call created:', result)

    return new Response(
      JSON.stringify({ 
        callId: result.uuid,
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
