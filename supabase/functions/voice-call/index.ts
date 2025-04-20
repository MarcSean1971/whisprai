
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from "npm:twilio@4.13.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, from, retryCount = 0 } = await req.json();
    
    if (!to || !from) {
      throw new Error('Missing required parameters: to, from');
    }

    console.log(`Initiating call from ${from} to ${to} (attempt ${retryCount + 1})`);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY');
    const twilioApiSecret = Deno.env.get('TWILIO_API_SECRET');
    const twimlAppSid = Deno.env.get('TWILIO_TWIML_APP_SID');

    if (!accountSid || (!authToken && (!twilioApiKey || !twilioApiSecret))) {
      throw new Error('Missing required Twilio credentials');
    }

    if (!twimlAppSid) {
      throw new Error('Missing Twilio TwiML App SID');
    }

    const client = twilio(twilioApiKey || accountSid, twilioApiSecret || authToken);
    
    try {
      // Use the TwiML App SID instead of generating TwiML directly
      const callData = await client.calls.create({
        applicationSid: twimlAppSid,
        to: `client:${to}`,
        from: `client:${from}`,
        statusCallback: `https://vmwiigfhjvwecnlwppnj.supabase.co/functions/v1/call-status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
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
    } catch (callError: any) {
      // If the error indicates the client is not available/registered
      if (callError.code === 31204 || callError.code === 31205) {
        if (retryCount < MAX_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          
          // Retry the call
          const response = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify({ to, from, retryCount: retryCount + 1 })
          });
          
          return response;
        }
      }
      throw callError;
    }

  } catch (error) {
    console.error('Error initiating call:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If this persists, please ensure both parties are online and try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
