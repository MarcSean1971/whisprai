
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message text is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            content: 'You are a toxicity analyzer. Score the aggressiveness of messages on a scale from 0 to 100, where 0 is not aggressive at all and 100 is extremely aggressive. Respond with ONLY the numeric score.'
          },
          {
            role: 'user',
            content: `Analyze the aggressiveness of this message: "${message}"`
          }
        ],
      }),
    });

    const data = await response.json();
    const score = parseInt(data.choices[0].message.content.trim());
    
    return new Response(
      JSON.stringify({ score: isNaN(score) ? 0 : score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing toxicity:', error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze message toxicity" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
