
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
    // Check if user is authenticated
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

    console.log('Creating Vonage session for:', { conversationId, recipientId });

    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY');
    
    if (!apiKey || !privateKey) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    // Create session using Vonage Video API
    const sessionResponse = await fetch('https://api.opentok.com/session/create', {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'medium=routed&archiveMode=manual'
    });

    if (!sessionResponse.ok) {
      console.error('Failed to create session:', await sessionResponse.text());
      throw new Error('Failed to create Vonage session');
    }

    const sessionData = await sessionResponse.text();
    const sessionId = sessionData.match(/<session_id>(.*?)<\/session_id>/)?.[1];

    if (!sessionId) {
      throw new Error('Invalid session response from Vonage');
    }

    console.log('Session created:', { sessionId });

    // Generate token using REST API
    const tokenResponse = await fetch(`https://api.opentok.com/v2/project/${apiKey}/token`, {
      method: 'POST',
      headers: {
        'X-OPENTOK-AUTH': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        role: 'publisher',
        data: JSON.stringify({ userId: user.id }),
        expire_time: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      })
    });

    if (!tokenResponse.ok) {
      console.error('Failed to generate token:', await tokenResponse.text());
      throw new Error('Failed to generate Vonage token');
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
        sessionId: sessionId,
        token: token,
        apiKey: apiKey
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
