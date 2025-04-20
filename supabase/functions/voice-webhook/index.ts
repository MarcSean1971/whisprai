
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from "npm:twilio@4.13.0"

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

    // Configure the call behavior with error handling
    const dial = twiml.dial({ 
      callerId: from,
      timeout: 20, // Give more time for the client to answer
      action: `https://vmwiigfhjvwecnlwppnj.supabase.co/functions/v1/call-status`,
      method: 'POST'
    });
    
    dial.client({
      statusCallbackEvent: ['initiated', 'ringing', 'answered'],
      statusCallback: `https://vmwiigfhjvwecnlwppnj.supabase.co/functions/v1/call-status`,
      statusCallbackMethod: 'POST'
    }, to);

    // Set response headers for TwiML
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/xml',
    };

    console.log('Returning TwiML response');
    return new Response(twiml.toString(), { headers });

  } catch (error) {
    console.error('Error in voice-webhook:', error);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('An error occurred while processing your call. Please try again.');
    
    return new Response(twiml.toString(), { 
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    });
  }
})
