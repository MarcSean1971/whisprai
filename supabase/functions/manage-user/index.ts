
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserUpdateRequest {
  userId: string;
  action: 'suspend' | 'unsuspend';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { userId, action } = await req.json() as UserUpdateRequest;

    if (!userId || !action) {
      throw new Error('Missing required parameters');
    }

    let result;
    
    switch (action) {
      case 'suspend':
        result = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '1000y' });
        break;
      case 'unsuspend':
        result = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: null });
        break;
      default:
        throw new Error('Invalid action');
    }

    if (result.error) {
      throw result.error;
    }

    return new Response(JSON.stringify({ user: result.data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
