
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from "npm:twilio@4.13.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default token TTL in seconds
const DEFAULT_TTL = 1800; // 30 minutes
const MIN_TTL = 300; // 5 minutes
const MAX_TTL = 7200; // 2 hours

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identity, ttl: requestedTtl } = await req.json();
    
    if (!identity) {
      console.error('Missing identity parameter');
      throw new Error('Missing required parameter: identity');
    }

    // Validate and normalize TTL
    const ttl = Math.min(Math.max(requestedTtl || DEFAULT_TTL, MIN_TTL), MAX_TTL);
    console.log(`Generating token for identity: ${identity} with TTL: ${ttl}s`);

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
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;
      
      // Get current time for token creation
      const now = Math.floor(Date.now() / 1000);
      
      // Create an access token with the specified TTL
      const token = new AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret,
        { 
          identity,
          ttl: ttl,
          nbf: now // Not Before - token becomes valid immediately
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
      
      // Basic validation check on the token format
      const jwtParts = tokenString.split('.');
      if (jwtParts.length !== 3) {
        throw new Error('Generated token has invalid JWT format');
      }
      
      try {
        // Try to decode the payload to make sure it's valid base64
        atob(jwtParts[1]);
      } catch (e) {
        throw new Error('Generated token has invalid base64 encoding');
      }
      
      console.log('Token generated successfully');

      const currentTime = Date.now();
      const expiresAt = currentTime + (ttl * 1000);

      return new Response(
        JSON.stringify({ 
          token: tokenString,
          identity,
          accountSid: twilioAccountSid,
          ttl: ttl,
          timestamp: new Date(currentTime).toISOString(),
          expiresAt: new Date(expiresAt).toISOString(),
          validFrom: new Date(currentTime).toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
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
        details: 'If this persists, please check your Twilio credentials or contact support.',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        },
      }
    );
  }
})
