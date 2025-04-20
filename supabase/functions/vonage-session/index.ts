
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import OpenTok from "https://esm.sh/opentok@2.16.0";

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

    console.log('Using Vonage credentials with OpenTok SDK');
    
    // Initialize the OpenTok SDK
    const openTok = new OpenTok(apiKey, apiSecret);
    
    // Create a session using the SDK
    const createSession = () => {
      return new Promise((resolve, reject) => {
        openTok.createSession({ mediaMode: 'relayed' }, (error, session) => {
          if (error) {
            console.error('Error creating session:', error);
            reject(error);
          } else {
            resolve(session);
          }
        });
      });
    };

    console.log('Creating session with OpenTok SDK');
    const session = await createSession();
    
    if (!session || !session.sessionId) {
      throw new Error('Failed to create session');
    }

    const sessionId = session.sessionId;
    console.log('Session created successfully:', { sessionId });

    // Generate a token using the SDK
    const tokenOptions = {
      role: 'publisher',
      data: JSON.stringify({ userId: user.id }),
      expireTime: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    console.log('Generating token with options:', { ...tokenOptions, data: '(redacted)' });
    const token = openTok.generateToken(sessionId, tokenOptions);
    
    if (!token) {
      throw new Error('Failed to generate token');
    }

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
