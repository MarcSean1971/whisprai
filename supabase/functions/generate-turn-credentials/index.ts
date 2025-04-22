
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { Twilio } from 'https://esm.sh/twilio@4.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwilioIceServer {
  urls: string[];
  username: string;
  credential: string;
}

interface IceServersResponse {
  ice_servers: TwilioIceServer[];
  ttl: number;
  timestamp: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    
    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials')
    }

    // Initialize Twilio client
    const twilio = new Twilio(accountSid, authToken)
    
    // Get Network Traversal Service tokens
    const token = await twilio.tokens.create()
    
    // Format response
    const iceServers = token.iceServers.map(server => ({
      urls: Array.isArray(server.urls) ? server.urls : [server.urls],
      username: server.username || '',
      credential: server.credential || ''
    }))
    
    // Add standard STUN servers to improve connectivity
    const standardStunServers = [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:global.stun.twilio.com:3478'] }
    ]
    
    const responseData: IceServersResponse = {
      ice_servers: [...standardStunServers, ...iceServers],
      ttl: 86400, // 24 hours in seconds
      timestamp: Date.now()
    }
    
    console.log(`Generated ICE servers successfully. Server count: ${responseData.ice_servers.length}`)
    
    // Return the formatted response
    return new Response(JSON.stringify(responseData), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    })
    
  } catch (error) {
    console.error(`Error generating TURN credentials: ${error.message}`)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate TURN credentials' 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })
  }
})
