
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import OpenTokClass from "https://esm.sh/opentok@2.16.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      throw new Error('Not authenticated');
    }

    // Parse request body
    const { conversationId, recipientId } = await req.json();
    
    if (!conversationId || !recipientId) {
      throw new Error('Missing required parameters');
    }

    // Initialize OpenTok with API key and private key
    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY');
    
    if (!apiKey || !privateKey) {
      throw new Error('Vonage API credentials not configured');
    }

    // Create OpenTok instance
    const OpenTok = OpenTokClass.default || OpenTokClass;
    const opentok = new OpenTok(apiKey, privateKey);

    // Create a new session with specific options
    const session = await new Promise((resolve, reject) => {
      opentok.createSession({ mediaMode: 'routed' }, (error: any, session: any) => {
        if (error) {
          console.error('Error creating session:', error);
          reject(error);
        } else {
          resolve(session);
        }
      });
    });

    // Generate token for the user
    const token = opentok.generateToken(session.sessionId, {
      role: 'publisher',
      data: JSON.stringify({ userId: user.id }),
      expireTime: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    });

    // Store session info in database
    const sessionKey = `call:${conversationId}:${[user.id, recipientId].sort().join('-')}`;
    const { error: insertError } = await supabaseClient
      .from('call_sessions')
      .insert({
        session_key: sessionKey,
        session_id: session.sessionId,
        created_by: user.id,
        conversation_id: conversationId
      });

    if (insertError) {
      throw new Error(`Failed to store session: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.sessionId,
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
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
