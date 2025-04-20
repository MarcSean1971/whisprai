
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { create, SignJWT } from "https://esm.sh/jose@4.14.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY');
    
    if (!apiKey || !privateKey) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    // Generate JWT for Vonage API authentication
    const jwt = await new SignJWT({
      application_id: Deno.env.get('VONAGE_APPLICATION_ID'),
      sub: apiKey,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(privateKey));

    console.log('Generated JWT for Vonage API');

    // Create session using Vonage Video API
    const sessionResponse = await fetch('https://api.opentok.com/v2/project/session/create', {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': jwt,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "mediaMode": "routed",
        "archiveMode": "manual"
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Failed to create session:', errorText);
      throw new Error(`Failed to create Vonage session: ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.session_id;

    if (!sessionId) {
      throw new Error('Invalid session response from Vonage');
    }

    console.log('Session created:', { sessionId });

    // Generate token
    const tokenResponse = await fetch(`https://api.opentok.com/v2/project/${apiKey}/token`, {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': jwt,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        role: 'publisher',
        data: JSON.stringify({ userId: user.id }),
        expire_time: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to generate token:', errorText);
      throw new Error(`Failed to generate Vonage token: ${errorText}`);
    }

    const { token } = await tokenResponse.json();

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

    console.log('Session stored successfully');

    return new Response(
      JSON.stringify({
        sessionId,
        token,
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
