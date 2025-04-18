
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { renderAsync } from 'npm:@react-email/components@0.0.12'
import { Resend } from 'npm:resend@1.0.0'
import { ConfirmSignupEmail } from './_templates/confirm-signup.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, confirmationUrl } = await req.json()

    if (!email || !confirmationUrl) {
      throw new Error('Missing required fields: email and confirmationUrl are required')
    }

    const html = await renderAsync(
      ConfirmSignupEmail({ 
        email,
        confirmationUrl,
      })
    )

    const data = await resend.emails.send({
      from: 'WhisprAI <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm your WhisprAI account',
      html,
    })

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
