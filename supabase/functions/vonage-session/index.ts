
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
    const { recipientId } = await req.json()
    
    if (!recipientId) {
      throw new Error('Recipient ID is required')
    }

    const vonage = new Vonage({
      applicationId: Deno.env.get('VONAGE_APPLICATION_ID'),
      privateKey: Deno.env.get('VONAGE_PRIVATE_KEY')
    })

    // Create an NCCO that plays a ringtone and connects to the conversation
    const ncco = [
      {
        action: 'stream',
        streamUrl: ['https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/sounds/ringtone.mp3'],
        loop: 0
      },
      {
        action: 'conversation',
        name: `conversation-${Date.now()}`,
        startOnEnter: true,
        endOnExit: true,
        record: false,
        canSpeak: ['*'],
        canHear: ['*']
      }
    ]

    // Generate a unique session ID for this call
    const sessionId = crypto.randomUUID()

    return new Response(
      JSON.stringify({ 
        sessionId,
        ncco
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
