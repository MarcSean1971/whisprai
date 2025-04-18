
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { renderAsync } from 'npm:@react-email/components@0.0.12'
import { Resend } from 'npm:resend@2.0.0'
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
    console.log('Received request to send email to:', email)

    if (!email || !confirmationUrl) {
      console.error('Missing required fields:', { email, confirmationUrl })
      throw new Error('Missing required fields: email and confirmationUrl are required')
    }

    console.log('Rendering email template...')
    const html = await renderAsync(
      ConfirmSignupEmail({ 
        email,
        confirmationUrl,
      })
    )

    console.log('Sending email via Resend...')
    const data = await resend.emails.send({
      from: 'noreply@whisprai.app', // Simplified from address
      to: email,
      subject: 'Confirm your WhisprAI account',
      html,
    })

    console.log('Email sent successfully:', data)
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Detailed error in send-email function:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })

    let errorMessage = 'An error occurred while sending the email'
    if (error.message.includes('535')) {
      errorMessage = 'Email authentication failed. Please verify domain configuration.'
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        fullError: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

