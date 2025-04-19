
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || '';

    if (!openAIApiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { conversationId, userId, language = 'en', userLanguage, translatedContent } = await req.json();

    if (!conversationId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Check if user is a participant in the conversation
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (participantError || participantData.length === 0) {
      throw new Error('User is not a participant in this conversation');
    }

    // Get the last 10 messages for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        original_language
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      throw new Error('Failed to fetch messages: ' + messagesError.message);
    }

    // Reverse to get chronological order
    const conversationHistory = [...messages].reverse();
    
    if (conversationHistory.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the last message for main focus
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    
    // Only generate predictions if the last message was not sent by the current user
    if (lastMessage.sender_id === userId) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use translated content if available for the conversation history
    const formattedHistory = conversationHistory.map(msg => {
      const msgContent = translatedContent && translatedContent[msg.id] 
        ? translatedContent[msg.id] 
        : msg.content;
      
      return {
        role: msg.sender_id === userId ? "user" : "other",
        content: msgContent
      };
    });

    // Create prompt for OpenAI
    let prompt = `Generate 3-5 short, relevant, natural-sounding reply suggestions for the following conversation. 
    The suggestions should be in ${userLanguage || language} language.
    Each suggestion should be a possible response that the user might want to send.
    Keep suggestions brief (under 100 characters each) and varied in tone and content.`;

    // Get AI instructions for predictive answers
    const { data: instructions, error: instructionsError } = await supabase
      .from('ai_instructions')
      .select('content')
      .eq('name', 'predictive_answers')
      .eq('suspended', false)
      .single();

    if (instructions?.content) {
      prompt += `\n${instructions.content}`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: prompt 
          },
          {
            role: 'user',
            content: `Conversation history: ${JSON.stringify(formattedHistory)}
            
            Format your response as a JSON array containing objects with 'text' property for each suggestion. 
            Example: [{"text":"Sure, I'd be happy to help!"}, {"text":"Let me think about that."}, {"text":"That's interesting, tell me more."}]`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openaiData = await response.json();
    let suggestions = [];
    
    try {
      const content = openaiData.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      suggestions = Array.isArray(parsedContent) ? parsedContent : parsedContent.suggestions || [];
      
      suggestions = suggestions.map((suggestion, index) => ({
        id: `suggestion-${index}`,
        text: typeof suggestion === 'string' ? suggestion : suggestion.text
      })).filter(s => s.text && typeof s.text === 'string');
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      suggestions = [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-predictive-answers function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
