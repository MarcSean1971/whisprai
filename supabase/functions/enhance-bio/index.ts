
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
    const { bio } = await req.json();
    
    if (!bio) {
      return new Response(
        JSON.stringify({ error: "Bio text is required" }),
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

    console.log('Calling OpenAI API to enhance bio...');
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
            content: 'You are a helpful assistant specialized in improving and polishing user bios or profile descriptions. Make the text more professional, engaging, and clear while keeping the original meaning intact. Do not add fictional details or make it too verbose. Keep a similar length to the original. DO NOT add any quotation marks to your response.'
          },
          {
            role: 'user',
            content: `Please improve this bio text: ${bio}`
          }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to enhance bio with AI');
    }

    const data = await openAIResponse.json();
    // Clean up the response: remove quotes and trim whitespace
    const enhancedBio = data.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, ''); // Remove quotes at start/end if present
    
    console.log('Bio enhanced successfully');

    return new Response(
      JSON.stringify({ enhancedBio }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in enhance-bio function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to enhance bio' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
