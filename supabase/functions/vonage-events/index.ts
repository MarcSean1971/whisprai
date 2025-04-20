
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
    // This endpoint is public (not requiring authentication) to allow Vonage to send events
    // Verify the request is coming from Vonage if needed
    
    const payload = await req.json();
    console.log('Vonage event received:', payload);
    
    // Process event based on payload
    // Example: Record call events, durations, etc.
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    if (payload.event === 'connectionCreated' || payload.event === 'connectionDestroyed') {
      // Update call_sessions table with connection status
      // This could be used to track active participants
      await supabaseAdmin
        .from('call_events')
        .insert({
          session_id: payload.sessionId,
          event_type: payload.event,
          connection_id: payload.connection?.connectionId,
          user_data: payload.connection?.data,
          created_at: new Date().toISOString()
        });
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing Vonage event:', error.message);
    
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
