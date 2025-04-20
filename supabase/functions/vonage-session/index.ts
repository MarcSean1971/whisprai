
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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

    // Get Vonage API credentials from environment variables
    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const apiSecret = Deno.env.get('VONAGE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    console.log('Using Vonage credentials for session creation');
    
    // Generate API URL with key and secret as query parameters
    // This is one of the authentication methods supported by OpenTok REST API
    const sessionUrl = new URL('https://api.opentok.com/session/create');
    sessionUrl.searchParams.append('api_key', apiKey);
    sessionUrl.searchParams.append('api_secret', apiSecret);
    
    console.log('Creating OpenTok session with URL params authentication');

    // Create session
    const sessionResponse = await fetch(sessionUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'p2p.preference=enabled'
    });

    console.log('Session response status:', sessionResponse.status);
    console.log('Session response headers:', Object.fromEntries(sessionResponse.headers));
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Session creation failed:', errorText);
      throw new Error(`OpenTok API error (${sessionResponse.status}): ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    
    if (!sessionData.sessions || !sessionData.sessions[0].session_id) {
      console.error('Invalid session data:', sessionData);
      throw new Error('Missing session_id in OpenTok API response');
    }

    const sessionId = sessionData.sessions[0].session_id;
    console.log('Session created:', { sessionId });

    // Generate token URL with key and secret as query parameters
    const tokenUrl = new URL('https://api.opentok.com/v2/project/' + apiKey + '/token');
    tokenUrl.searchParams.append('api_key', apiKey);
    tokenUrl.searchParams.append('api_secret', apiSecret);

    // Generate token
    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        data: JSON.stringify({ userId: user.id }),
        role: 'publisher',
        expire_time: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      })
    });

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers));
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token generation failed:', errorText);
      throw new Error(`OpenTok API error (${tokenResponse.status}): ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      console.error('Invalid token data:', tokenData);
      throw new Error('Missing token in OpenTok API response');
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

    console.log('Session stored successfully');

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
