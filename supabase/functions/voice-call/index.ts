
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
    const { to, from } = await req.json();
    
    if (!to || !from) {
      throw new Error('Missing required parameters: to, from');
    }

    console.log(`Initiating call from ${from} to ${to}`);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY');
    const twilioApiSecret = Deno.env.get('TWILIO_API_SECRET');

    if (!accountSid || (!authToken && (!twilioApiKey || !twilioApiSecret))) {
      throw new Error('Missing required Twilio credentials');
    }

    const client = twilio(twilioApiKey || accountSid, twilioApiSecret || authToken);
    
    // Create a TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Hello, this is a test call from your chat application.');
    twiml.dial().client(to);

    const callData = await client.calls.create({
      twiml: twiml.toString(),
      to: `client:${to}`,
      from: `client:${from}`,
    });

    console.log('Call initiated successfully:', callData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: callData.sid,
        status: callData.status
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error initiating call:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
