
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, conversationId } = await req.json()
    const prompt = content.replace(/^AI:\s*/, '').trim()

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

    const aiData = await openAIResponse.json()
    const aiResponse = aiData.choices[0].message.content

    // Store AI message in the database
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_id: null,
        ai_metadata: {
          model: 'gpt-4o-mini',
          prompt,
          tokens: aiData.usage
        }
      })
      .select()
      .single()

    if (messageError) {
      throw messageError
    }

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
