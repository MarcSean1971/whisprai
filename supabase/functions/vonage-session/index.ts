
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vonage Video API endpoints
const API_BASE = "https://api.opentok.com/session";
const TOKEN_ENDPOINT = "https://api.opentok.com/v2/project/";

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

    // Get Vonage API credentials from environment variables
    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const apiSecret = Deno.env.get('VONAGE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      console.error('Missing Vonage credentials');
      throw new Error('Vonage API credentials not configured');
    }

    console.log('Creating Vonage Video API session...');
    
    // Create Basic Auth token
    const basicAuth = btoa(`${apiKey}:${apiSecret}`);
    
    // Create a session using Basic Auth
    const createSessionResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        mediaMode: 'relayed',
      }),
    });
    
    if (!createSessionResponse.ok) {
      const errorDetails = await createSessionResponse.text();
      console.error('Session creation failed:', errorDetails);
      throw new Error(`Failed to create session: HTTP ${createSessionResponse.status}`);
    }
    
    const sessionData = await createSessionResponse.json();
    const sessionId = sessionData.sessions?.[0]?.session_id;
    
    if (!sessionId) {
      throw new Error('No session ID in response');
    }
    
    console.log('Session created successfully:', { sessionId });

    // Generate token with Basic Auth
    const tokenResponse = await fetch(`${TOKEN_ENDPOINT}${apiKey}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        data: JSON.stringify({ userId: user.id }),
        role: 'publisher',
        expire_time: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorDetails = await tokenResponse.text();
      console.error('Token generation failed:', errorDetails);
      throw new Error(`Failed to generate token: HTTP ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.token;
    
    console.log('Token generated successfully');

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
