
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user with Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Not authenticated');
    }

    // Parse request body
    const { conversationId, recipientId } = await req.json();
    
    if (!conversationId || !recipientId) {
      throw new Error('Missing required parameters');
    }

    // Get Vonage API credentials
    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const apiSecret = Deno.env.get('VONAGE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    console.log('Creating Vonage Video API session...');

    // Using X-OPENTOK-AUTH header as specified in the OpenTok API docs
    // The header expects a JWT token, not basic auth
    const tokenData = {
      iss: apiKey,
      ist: "project",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 180, // 3 minutes expiration
      jti: crypto.randomUUID()
    };

    // Create the JWT signature
    const encoder = new TextEncoder();
    const header = encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = encoder.encode(JSON.stringify(tokenData));
    
    const base64Header = btoa(String.fromCharCode(...new Uint8Array(header)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64Payload = btoa(String.fromCharCode(...new Uint8Array(payload)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const toSign = encoder.encode(`${base64Header}.${base64Payload}`);
    
    // Create HMAC signature
    const key = encoder.encode(apiSecret);
    const signatureBuffer = await crypto.subtle.sign(
      { name: "HMAC", hash: "SHA-256" },
      await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      toSign
    );
    
    const signatureArray = new Uint8Array(signatureBuffer);
    const signature = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const jwt = `${base64Header}.${base64Payload}.${signature}`;

    // Create session with the JWT token
    const sessionResponse = await fetch('https://api.opentok.com/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-OPENTOK-AUTH': jwt,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'p2p.preference': 'enabled'
      }).toString()
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Session creation failed:', {
        status: sessionResponse.status,
        error: errorText,
        headers: Object.fromEntries(sessionResponse.headers),
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-OPENTOK-AUTH': jwt.substring(0, 20) + '...' // Log part of the JWT for debugging
        }
      });
      throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('Session response:', sessionData);

    if (!sessionData.sessions || !sessionData.sessions[0] || !sessionData.sessions[0].session_id) {
      console.error('Invalid session data:', sessionData);
      throw new Error('No session ID in response');
    }

    const sessionId = sessionData.sessions[0].session_id;
    console.log('Session created:', { sessionId });

    // Generate token with the same JWT token
    const tokenResponse = await fetch(`https://api.opentok.com/v2/project/${apiKey}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-OPENTOK-AUTH': jwt,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        session_id: sessionId,
        role: 'publisher',
        data: JSON.stringify({ userId: user.id }),
        expire_time: (Math.floor(Date.now() / 1000) + 3600).toString() // 1 hour
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token generation failed:', {
        status: tokenResponse.status,
        error: errorText
      });
      throw new Error(`Failed to generate token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenResult = await tokenResponse.json();
    console.log('Token response:', tokenResult);

    if (!tokenResult.token) {
      console.error('Invalid token data:', tokenResult);
      throw new Error('No token in response');
    }

    // Store session info in database
    const sessionKey = `call:${conversationId}:${[user.id, recipientId].sort().join('-')}`;
    const { error: insertError } = await supabaseClient
      .from('call_sessions')
      .insert({
        session_key: sessionKey,
        session_id: sessionId,
        created_by: user.id,
        conversation_id: conversationId
      });

    if (insertError) {
      console.error('Failed to store session:', insertError);
      throw new Error(`Failed to store session: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        sessionId,
        token: tokenResult.token,
        apiKey
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in vonage-session function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
