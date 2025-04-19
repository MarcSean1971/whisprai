
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, conversationId, userId } = await req.json()
    
    if (!audio || !conversationId || !userId) {
      throw new Error('Missing required parameters')
    }

    console.log('Processing voice message for user:', userId, 'in conversation:', conversationId);

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: 'audio/webm' });
    
    // Prepare form data for transcription
    const formData = new FormData()
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')

    // Transcribe audio
    console.log('Sending audio to OpenAI for transcription');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    console.log('Transcription successful:', transcriptionResult.text.substring(0, 50) + '...');

    // Generate a simple filename for the voice message
    const timestamp = new Date().getTime();
    const filename = `${userId}/${conversationId}/${timestamp}.webm`;
    
    console.log('Uploading voice message to path:', filename);

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/voice_messages/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'audio/webm',
        },
        body: binaryData,
      }
    );

    if (!uploadResponse.ok) {
      console.error('Storage upload error:', await uploadResponse.text());
      throw new Error('Failed to upload voice message');
    }

    console.log('Voice message uploaded successfully to:', filename);

    return new Response(
      JSON.stringify({ 
        text: transcriptionResult.text, 
        audioPath: filename
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing voice message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
