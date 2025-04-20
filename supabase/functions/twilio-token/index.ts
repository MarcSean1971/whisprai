
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
    const { identity } = await req.json();
    
    if (!identity) {
      console.error('Missing identity parameter');
      throw new Error('Missing required parameter: identity');
    }

    console.log(`Generating token for identity: ${identity}`);

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY');
    const twilioApiSecret = Deno.env.get('TWILIO_API_SECRET');
    const twilioTwimlAppSid = Deno.env.get('TWILIO_TWIML_APP_SID');

    if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !twilioTwimlAppSid) {
      console.error('Missing Twilio credentials', {
        hasAccountSid: !!twilioAccountSid,
        hasApiKey: !!twilioApiKey,
        hasApiSecret: !!twilioApiSecret,
        hasTwimlAppSid: !!twilioTwimlAppSid
      });
      throw new Error('Server configuration error: Missing Twilio credentials');
    }

    try {
      // Use the twilio package to create a token
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;
      
      // Create an access token with a 1 hour TTL
      const token = new AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret,
        { 
          identity,
          ttl: 3600 // 1 hour in seconds
        }
      );

      // Create and add a voice grant
      const grant = new VoiceGrant({
        outgoingApplicationSid: twilioTwimlAppSid,
        incomingAllow: true,
      });

      token.addGrant(grant);

      // Generate the token string
      const tokenString = token.toJwt();
      console.log('Token generated successfully');

      return new Response(
        JSON.stringify({ 
          token: tokenString,
          identity,
          accountSid: twilioAccountSid,
          ttl: 3600
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (tokenError) {
      console.error('Error generating Twilio token:', tokenError);
      throw new Error(`Failed to generate access token: ${tokenError.message}`);
    }

  } catch (error) {
    console.error('Error in Twilio token function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If this persists, please contact support.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
