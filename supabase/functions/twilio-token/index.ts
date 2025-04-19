
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Twilio, jwt } from "https://esm.sh/twilio@4.13.0"

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
      // Create an access token using the jwt.AccessToken class from Twilio
      const token = new jwt.AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret,
        { identity }
      );

      // Create a Voice grant and add it to the token
      const voiceGrant = new jwt.AccessToken.VoiceGrant({
        outgoingApplicationSid: twilioTwimlAppSid,
        incomingAllow: true,
      });

      // Add the grant to the token
      token.addGrant(voiceGrant);

      // Generate the token string
      const tokenString = token.toJwt();
      console.log('Token generated successfully');

      return new Response(
        JSON.stringify({ 
          token: tokenString,
          identity,
          accountSid: twilioAccountSid 
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
