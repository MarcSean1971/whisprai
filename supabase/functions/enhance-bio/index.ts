
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bio, settings } = await req.json();
    
    if (!bio) {
      return new Response(
        JSON.stringify({ error: "Bio text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get API key from settings or environment
    const apiKey = settings?.api_key || Deno.env.get("OPENAI_API_KEY");
    const model = settings?.model || "gpt-4o-mini";
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Call OpenAI to enhance the bio
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant specialized in improving and polishing user bios or profile descriptions. Make the text more professional, engaging, and clear while keeping the original meaning intact. Don't add fictional details or make it too verbose. Keep a similar length to the original."
          },
          {
            role: "user",
            content: `Please improve this bio: "${bio}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      console.error("OpenAI API error:", openAIData);
      return new Response(
        JSON.stringify({ error: "Failed to enhance bio with AI" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const enhancedBio = openAIData.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ enhancedBio }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in enhance-bio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
