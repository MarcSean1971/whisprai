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

    // Create proper OpenTok auth token
    const auth = btoa(`${apiKey}:${apiSecret}`);
    console.log('Creating OpenTok session with credentials');

    // Create session with OpenTok-specific headers
    const sessionResponse = await fetch('https://api.opentok.com/session/create', {
      method: 'POST',
      headers: {
        'X-TB-TOKEN-AUTH': auth,
        'X-TB-VERSION': '1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'medium=routed&archiveMode=manual'
    });

    const sessionResponseText = await sessionResponse.text();
    console.log('Session response status:', sessionResponse.status);
    console.log('Session response headers:', Object.fromEntries(sessionResponse.headers));
    console.log('Session response body:', sessionResponseText);

    // Check for XML error response
    if (sessionResponseText.includes('errorPayload')) {
      const errorMatch = sessionResponseText.match(/<message>(.*?)<\/message>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown error';
      throw new Error(`OpenTok API error: ${errorMessage}`);
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionResponseText);
    } catch (e) {
      console.error('Failed to parse session response:', e);
      throw new Error('Invalid response format from OpenTok API');
    }

    if (!sessionData.session_id) {
      console.error('Invalid session data:', sessionData);
      throw new Error('Invalid session response from OpenTok API');
    }

    const sessionId = sessionData.session_id;
    console.log('Session created:', { sessionId });

    // Generate token with same OpenTok auth method
    const tokenResponse = await fetch('https://api.opentok.com/token/create', {
      method: 'POST',
      headers: {
        'X-TB-TOKEN-AUTH': auth,
        'X-TB-VERSION': '1.0',
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

    const tokenResponseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers));
    console.log('Token response body:', tokenResponseText);

    // Check for XML error response in token creation
    if (tokenResponseText.includes('errorPayload')) {
      const errorMatch = tokenResponseText.match(/<message>(.*?)<\/message>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown error';
      throw new Error(`OpenTok API error: ${errorMessage}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (e) {
      console.error('Failed to parse token response:', e);
      throw new Error('Invalid token response format from OpenTok API');
    }

    if (!tokenData.token) {
      console.error('Invalid token data:', tokenData);
      throw new Error('Invalid token response from OpenTok API');
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
