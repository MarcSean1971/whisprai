
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

    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const apiSecret = Deno.env.get('VONAGE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    console.log('Using Vonage credentials with API Key:', apiKey);

    // Create session using Vonage Video API with API Key and Secret
    const sessionResponse = await fetch('https://api.opentok.com/session/create', {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': `${apiKey}:${apiSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'medium=routed&archiveMode=manual'
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Failed to create session:', errorText);
      throw new Error(`Failed to create Vonage session: ${errorText}`);
    }

    // Parse XML response
    const responseText = await sessionResponse.text();
    console.log('Session response:', responseText);
    
    // Extract session ID from XML response
    const sessionId = responseText.match(/<session_id>(.*?)<\/session_id>/)?.[1];

    if (!sessionId) {
      throw new Error('Invalid session response from Vonage');
    }

    console.log('Session created:', { sessionId });

    // Generate token using API Key and Secret
    const tokenResponse = await fetch(`https://api.opentok.com/token/create`, {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': `${apiKey}:${apiSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'session_id': sessionId,
        'role': 'publisher',
        'data': JSON.stringify({ userId: user.id }),
        'expire_time': (Math.floor(Date.now() / 1000) + 3600).toString() // 1 hour
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to generate token:', errorText);
      throw new Error(`Failed to generate Vonage token: ${errorText}`);
    }

    // Parse token from response
    const tokenText = await tokenResponse.text();
    console.log('Token response:', tokenText);
    
    // Extract token from XML response
    const token = tokenText.match(/<token>(.*?)<\/token>/)?.[1];
    
    if (!token) {
      throw new Error('Invalid token response from Vonage');
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
