
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Detect the language of the prompt
    const detectedLanguage = await detectLanguage(prompt)
    console.log('Detected language:', detectedLanguage)

    // Fetch relevant chat history from user's conversations
    const { data: chatHistory, error: historyError } = await supabase
      .from('messages')
      .select(`
        content,
        created_at,
        conversation_id,
        sender_id,
        original_language
      `)
      .or(`sender_id.eq.${userId},viewer_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (historyError) {
      console.error('Error fetching chat history:', historyError)
    }

    // Process chat history into a readable format for the AI
    const chatHistoryContext = chatHistory ? formatChatHistory(chatHistory) : ''
    
    // Create the system message with language preference and chat history
    const systemMessage = `
You are a helpful AI assistant in a chat conversation. Keep responses concise and natural.
Please respond in ${detectedLanguage} language.

Here is some recent chat history for context (newest messages first):
${chatHistoryContext}
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

    // Store AI message in the database with viewer_id
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_id: null,
        viewer_id: userId,
        original_language: detectedLanguage,
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

// Helper function to format chat history for the AI
function formatChatHistory(messages: any[]): string {
  if (!messages || messages.length === 0) return "No previous messages."
  
  return messages.map(msg => {
    const timestamp = new Date(msg.created_at).toLocaleString()
    const sender = msg.sender_id ? 'User' : 'AI'
    return `[${timestamp}] ${sender}: ${msg.content}`
  }).join('\n\n')
}

// Simple language detection function
async function detectLanguage(text: string): Promise<string> {
  // Languages mapping for basic detection
  const languages: Record<string, string[]> = {
    'en': ['the', 'is', 'and', 'to', 'hello', 'hi', 'how are you', 'what', 'where', 'when'],
    'es': ['el', 'la', 'que', 'hola', 'como estas', 'buenos dias', 'gracias'],
    'fr': ['le', 'la', 'je', 'bonjour', 'merci', 'comment', 'oui', 'non'],
    'de': ['der', 'die', 'das', 'und', 'hallo', 'guten tag', 'danke'],
    'it': ['il', 'la', 'che', 'ciao', 'grazie', 'buongiorno'],
    'pt': ['o', 'a', 'que', 'ola', 'obrigado', 'bom dia']
  };
  
  // Convert to lowercase for comparison
  const lowerText = text.toLowerCase();
  
  // Count word matches for each language
  const scores = Object.entries(languages).map(([lang, words]) => {
    let score = 0;
    for (const word of words) {
      if (lowerText.includes(word.toLowerCase())) {
        score++;
      }
    }
    return { lang, score };
  });
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Return highest score, or default to 'en'
  return scores[0].score > 0 ? scores[0].lang : 'en';
}
