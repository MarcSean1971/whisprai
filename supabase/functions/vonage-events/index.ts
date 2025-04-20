
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const event = await req.json()
    console.log('Received Vonage event:', JSON.stringify(event, null, 2))
    
    // Detailed event logging
    switch (event.status) {
      case 'started':
        console.log(`Call ${event.uuid} started`);
        break;
      case 'ringing':
        console.log(`Call ${event.uuid} is ringing`);
        break;
      case 'answered':
        console.log(`Call ${event.uuid} was answered`);
        break;
      case 'completed':
        console.log(`Call ${event.uuid} has ended`);
        break;
      default:
        console.log(`Unhandled event status: ${event.status}`);
    }

    return new Response(
      JSON.stringify({ received: true, status: 'processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error handling Vonage event:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
