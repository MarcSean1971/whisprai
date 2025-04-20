
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

    console.log('Creating app-to-app call to recipient:', recipientId)
    console.log('NCCO:', JSON.stringify(ncco, null, 2))

    const result = await vonage.voice.createCall({
      to: [{ 
        type: 'app',
        user: recipientId 
      }],
      from: { 
        type: 'app',
        user: sessionId 
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
