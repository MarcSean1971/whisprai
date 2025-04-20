
import { Vonage } from 'npm:@vonage/server-sdk'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing Vonage session request')
    
    const { recipientId } = await req.json()
    
    if (!recipientId) {
      console.error('Missing recipientId in request')
      throw new Error('Recipient ID is required')
    }

    const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY')
    const applicationId = Deno.env.get('VONAGE_APPLICATION_ID')

    if (!privateKey || !applicationId) {
      console.error('Missing Vonage credentials')
      throw new Error('Vonage credentials not configured')
    }

    console.log('Initializing Vonage client')

    const vonage = new Vonage({
      applicationId,
      privateKey
    })

    console.log('Generating JWT token')

    const jwt = vonage.jwt.generate({
      application_id: applicationId,
      sub: recipientId,
      exp: Math.round(new Date().getTime() / 1000) + 3600,
      acl: {
        paths: {
          "/*/users/**": {},
          "/*/conversations/**": {},
          "/*/sessions/**": {},
          "/*/rtc/**": {},
          "/*/media/**": {}
        }
      }
    })

    console.log('JWT token generated successfully')

    return new Response(
      JSON.stringify({ 
        token: jwt,
        applicationId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating Vonage session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
