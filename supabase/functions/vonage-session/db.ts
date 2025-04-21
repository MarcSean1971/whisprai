
export async function storeSession(
  supabaseClient: any,
  sessionKey: string,
  sessionId: string,
  userId: string,
  conversationId: string
) {
  const { error: insertError } = await supabaseClient
    .from("call_sessions")
    .insert({
      session_key: sessionKey,
      session_id: sessionId,
      created_by: userId,
      conversation_id: conversationId,
    });
  if (insertError) {
    console.error("[Vonage] Failed to store session in call_sessions:", insertError.message);
  }
}

export async function updateActiveCallWithSessionId(
  supabaseClient: any,
  callId: string,
  sessionId: string
) {
  const { error: updateError } = await supabaseClient
    .from("active_calls")
    .update({ session_id: sessionId })
    .eq("id", callId);

  if (updateError) {
    console.error("[Vonage] Failed to update active_calls:", updateError.message);
  } else {
    console.log("[Vonage] Updated active_calls with sessionId for callId:", callId);
  }
}
