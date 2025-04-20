
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

    const sessionId = crypto.randomUUID()

    // Create an NCCO that connects to the conversation
    const ncco = [
      {
        action: 'conversation',
        name: `conversation-${sessionId}`,
        startOnEnter: true,
        endOnExit: true,
        record: false,
        canSpeak: ['*'],
        canHear: ['*'],
        eventWebhook: `https://vmwiigfhjvwecnlwppnj.supabase.co/functions/v1/vonage-events?sessionId=${sessionId}`
      }
    ]

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
