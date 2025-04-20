
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling OpenAI API to enhance message...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a helpful assistant specialized in improving messages. Make the text more clear, engaging, and professional while keeping the original meaning intact. Keep a similar length to the original. DO NOT add any quotation marks to your response.'
          },
          {
            role: 'user',
            content: `Please improve this message: ${message}`
          }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to enhance message with AI');
    }

    const data = await openAIResponse.json();
    const enhancedMessage = data.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, '');
    
    console.log('Message enhanced successfully');

    return new Response(
      JSON.stringify({ enhancedMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in enhance-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to enhance message' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
