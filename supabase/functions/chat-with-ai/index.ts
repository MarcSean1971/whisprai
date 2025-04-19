
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
    const { content, conversationId, userId } = await req.json()
    const prompt = content.replace(/^AI:\s*/, '').trim()
    
    console.log('Processing AI message:', { conversationId, prompt, userId })

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant in a chat conversation. Keep responses concise and natural.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const aiData = await openAIResponse.json()
    console.log('OpenAI response:', aiData)
    
    const aiResponse = aiData.choices[0].message.content

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store AI message in the database with viewer_id
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_id: null,
        viewer_id: userId,
        ai_metadata: {
          model: 'gpt-4o-mini',
          prompt,
          tokens: aiData.usage
        }
      })
      .select()
      .single()

    if (messageError) {
      console.error('Database error:', messageError)
      throw messageError
    }

    console.log('Message stored successfully:', messageData)

    return new Response(
      JSON.stringify({ message: messageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
