
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
    await supabase
      .from('ai_messages')
      .update({ status: 'processing' })
      .eq('id', aiMessageId)

    // Fetch relevant chat history
    const { data: chatHistory } = await supabase
      .from('messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', aiMessage.conversation_id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Create the system message with context
    const systemMessage = `
You are a helpful AI assistant in a chat conversation. Keep responses concise and natural.

Recent chat history for context (newest messages first):
${chatHistory ? formatChatHistory(chatHistory) : 'No previous messages.'}
`;

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
          { role: 'system', content: systemMessage },
          { role: 'user', content: aiMessage.prompt }
        ],
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const aiData = await openAIResponse.json()
    const aiResponse = aiData.choices[0].message.content

    // Update the AI message with the response
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('Error updating AI message:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true }),
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

function formatChatHistory(messages: any[]): string {
  return messages.map(msg => {
    const timestamp = new Date(msg.created_at).toLocaleString()
    const sender = msg.sender_id ? 'User' : 'AI'
    return `[${timestamp}] ${sender}: ${msg.content}`
  }).join('\n\n')
}
