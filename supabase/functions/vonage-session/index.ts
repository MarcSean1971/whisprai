
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

    // Create Authorization header using API key and secret
    const authString = `${apiKey}:${apiSecret}`;
    const base64Auth = btoa(authString);

    // Create session
    const sessionResponse = await fetch('https://api.opentok.com/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-OPENTOK-AUTH': `Basic ${base64Auth}`,
        'Accept': 'application/json'
      }
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Session creation failed:', {
        status: sessionResponse.status,
        error: errorText,
        headers: Object.fromEntries(sessionResponse.headers)
      });
      throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('Session response:', sessionData);

    if (!sessionData.session_id) {
      console.error('Invalid session data:', sessionData);
      throw new Error('No session ID in response');
    }

    const sessionId = sessionData.session_id;
    console.log('Session created:', { sessionId });

    // Generate token
    const tokenResponse = await fetch('https://api.opentok.com/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-OPENTOK-AUTH': `Basic ${base64Auth}`,
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

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    if (!tokenData.token) {
      console.error('Invalid token data:', tokenData);
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
        token: tokenData.token,
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
