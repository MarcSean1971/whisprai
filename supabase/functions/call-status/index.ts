
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const from = formData.get('From')?.toString().replace('client:', '');
    const to = formData.get('To')?.toString().replace('client:', '');
    
    console.log(`Call status update - SID: ${callSid}, Status: ${callStatus}, From: ${from}, To: ${to}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update or insert call record in the database
    if (callSid && callStatus) {
      const { error } = await supabase
        .from('call_history')
        .upsert({
          call_sid: callSid,
          status: callStatus,
          from_user: from,
          to_user: to,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'call_sid'
        });

      if (error) {
        console.error('Error updating call status in database:', error);
      } else {
        console.log('Call status updated in database');
      }
    }

    return new Response(
      'Status recorded',
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/plain' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing call status update:', error);
    
    return new Response(
      error.message,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      }
    );
  }
})
