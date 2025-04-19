
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

    // Convert base64 to binary using chunked processing to prevent memory issues
    const binaryAudio = processBase64Chunks(audio);
    console.log('Converted base64 to binary, size:', binaryAudio.length, 'bytes');
    
    if (binaryAudio.length < 100) {
      throw new Error('Audio data is too small or empty');
    }
    
    // Prepare form data for transcription
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
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

    // Generate a unique filename for the voice message that doesn't start with "voice_messages/"
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
          'x-upsert': 'true'
        },
        body: binaryAudio,
      }
    );

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('Storage upload error:', uploadError);
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

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
