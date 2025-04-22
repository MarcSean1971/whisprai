
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

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

    // Instead of using the Twilio SDK directly, we'll use a direct API call
    const twilioBaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`
    
    const response = await fetch(twilioBaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Twilio API error: ${response.status} - ${errorText}`)
    }
    
    const tokenData = await response.json()
    
    // Format Twilio ice servers data
    const iceServers = tokenData.ice_servers.map((server: any) => ({
      urls: Array.isArray(server.url) ? server.url : [server.url],
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
