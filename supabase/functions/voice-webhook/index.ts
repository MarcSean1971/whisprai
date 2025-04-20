
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from "https://esm.sh/twilio@4.13.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request for voice call');
    
    // Create TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Get form data from the request
    const formData = await req.formData();
    const to = formData.get('To')?.toString().replace('client:', '');
    const from = formData.get('From')?.toString().replace('client:', '');
    
    console.log(`Processing call from ${from} to ${to}`);

    // Configure the call behavior
    const dial = twiml.dial({ callerId: from });
    dial.client(to);

    // Set response headers for TwiML
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/xml',
    };

    console.log('Returning TwiML response');
    return new Response(twiml.toString(), { headers });

  } catch (error) {
    console.error('Error in voice-webhook:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
