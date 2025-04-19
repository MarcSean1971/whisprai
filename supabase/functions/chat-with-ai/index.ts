
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { aiMessageId } = await req.json()
    console.log('Processing AI message:', aiMessageId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the AI message
    const { data: aiMessage, error: fetchError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('id', aiMessageId)
      .single()

    if (fetchError || !aiMessage) {
      console.error('Error fetching AI message:', fetchError)
      throw new Error('AI message not found')
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from('ai_messages')
      .update({ status: 'processing' })
      .eq('id', aiMessageId)

    if (updateError) {
      console.error('Error updating AI message status:', updateError)
      throw updateError
    }

    // Make the API call to OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: aiMessage.prompt }
        ],
      }),
    })

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const aiData = await openAIResponse.json()
    const aiResponse = aiData.choices[0].message.content

    // Update the AI message with the response
    const { error: finalUpdateError } = await supabase
      .from('ai_messages')
      .update({
        response: aiResponse,
        status: 'completed',
        metadata: {
          model: 'gpt-4o-mini',
          tokens: aiData.usage
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', aiMessageId)

    if (finalUpdateError) {
      console.error('Error updating AI message with response:', finalUpdateError)
      throw finalUpdateError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chat-with-ai function:', error)
    
    // Try to update the message status to error if possible
    if (error instanceof Error) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabase
          .from('ai_messages')
          .update({ 
            status: 'error',
            metadata: { error: error.message }
          })
          .eq('id', JSON.parse(req.body || '{}').aiMessageId)
      } catch (updateError) {
        console.error('Failed to update message status:', updateError)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
