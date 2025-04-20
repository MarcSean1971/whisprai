
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import OpenTok from 'https://esm.sh/opentok@2.16.0';

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
      throw new Error('Not authenticated');
    }

    // Initialize Vonage using credentials from environment variables
    const apiKey = Deno.env.get('VONAGE_API_KEY');
    const apiSecret = Deno.env.get('VONAGE_PRIVATE_KEY'); // Using private key for session creation
    
    if (!apiKey || !apiSecret) {
      throw new Error('Vonage credentials not configured');
    }

    // Parse request body
    const { conversationId, recipientId } = await req.json();
    
    if (!conversationId || !recipientId) {
      throw new Error('Missing required parameters');
    }

    // Create session ID
    const opentok = new OpenTok(apiKey, apiSecret);
    
    // Generate a unique session identifier based on the conversation
    const sessionKey = `call:${conversationId}:${[user.id, recipientId].sort().join('-')}`;
    
    // Create a function to promisify the OpenTok session creation
    const createSession = () => {
      return new Promise((resolve, reject) => {
        opentok.createSession({ mediaMode: 'routed' }, (error, session) => {
          if (error) {
            reject(error);
          } else {
            resolve(session);
          }
        });
      });
    };

    // Create the session
    const session = await createSession();
    
    // Generate a token for the current user
    const token = opentok.generateToken((session as any).sessionId, {
      role: 'publisher',
      data: JSON.stringify({ userId: user.id }),
      expireTime: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
    });

    // Store the session in the database for reference
    await supabaseClient
      .from('call_sessions')
      .upsert({
        session_key: sessionKey,
        session_id: (session as any).sessionId,
        created_by: user.id,
        conversation_id: conversationId,
        created_at: new Date().toISOString()
      })
      .select();

    return new Response(
      JSON.stringify({
        sessionId: (session as any).sessionId,
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
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
