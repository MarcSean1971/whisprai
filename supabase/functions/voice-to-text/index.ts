
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

    // Convert base64 to binary
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Prepare form data for transcription
    const formData = new FormData()
    const blob = new Blob([bytes], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')

    // Transcribe audio
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`OpenAI API error: ${await transcriptionResponse.text()}`)
    }

    const transcriptionResult = await transcriptionResponse.json()

    // Prepare file upload to Supabase Storage
    const uploadResponse = await fetch('https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/voice_messages/' + 
      `${userId}/${conversationId}/${Date.now()}.webm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'audio/webm',
      },
      body: bytes,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Storage upload error: ${await uploadResponse.text()}`)
    }

    const uploadResult = await uploadResponse.json()

    return new Response(
      JSON.stringify({ 
        text: transcriptionResult.text, 
        audioPath: uploadResult.Key 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
