
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define types for our call session
interface CallSession {
  id: string;
  caller_id: string;
  recipient_id: string;
  conversation_id: string;
  status: string;
  call_type: string;
  signaling_data: any | null;
  created_at: string;
  updated_at: string;
}

// Type for Supabase realtime payload
interface RealtimePayload {
  eventType: string;
  new: CallSession;
  old: CallSession | null;
}

/**
 * WebRTC signaling and call logic through Supabase call_sessions.
 * Use this hook to manage call lifecycle: start, receive invitation, respond with signaling, etc.
 */
export function useWebRTCCalls(conversationId: string, currentUserId: string, otherUserId: string) {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [signaling, setSignaling] = useState<any>(null);

  // Subscribe to real-time updates for call_sessions on this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`calls:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const typedPayload = payload as unknown as RealtimePayload;
          
          if (typedPayload.eventType === "INSERT" && typedPayload.new.status === "pending" && typedPayload.new.recipient_id === currentUserId) {
            setIncomingCall(typedPayload.new);
            setStatus("incoming");
          } else if (typedPayload.new && (typedPayload.new.caller_id === currentUserId || typedPayload.new.recipient_id === currentUserId)) {
            setCallSession(typedPayload.new);
            setStatus(typedPayload.new.status);
            if (typedPayload.new.status === "ended" || typedPayload.new.status === "rejected" || typedPayload.new.status === "missed") {
              setIsCalling(false);
              setIncomingCall(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const startCall = useCallback(async (callType: "audio" | "video" = "audio") => {
    setIsCalling(true);
    try {
      const { data, error } = await supabase
        .from("call_sessions")
        .insert({
          caller_id: currentUserId,
          recipient_id: otherUserId,
          conversation_id: conversationId,
          status: "pending",
          call_type: callType,
          signaling_data: null,
        })
        .select()
        .single();
      if (error) {
        setIsCalling(false);
        toast.error("Failed to start call.");
        return null;
      }
      setCallSession(data);
      setStatus("pending");
      return data;
    } catch (err) {
      setIsCalling(false);
      toast.error("Could not create call session.");
      return null;
    }
  }, [conversationId, currentUserId, otherUserId]);

  const updateSignalingData = useCallback(async (sessionId: string, signalingObj: any) => {
    // Post updated SDP/candidate to the DB
    const { error } = await supabase
      .from("call_sessions")
      .update({
        signaling_data: signalingObj,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    if (error) toast.error("Failed to send signaling data.");
  }, []);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "connected", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    if (error) toast.error("Failed to accept call.");
    else setStatus("connected");
  }, [incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    if (error) toast.error("Failed to reject call.");
    setIncomingCall(null);
    setStatus("rejected");
  }, [incomingCall]);

  useEffect(() => {
    // Auto-clear ended call session
    if (callSession && ["ended", "rejected", "missed"].includes(callSession.status)) {
      setCallSession(null);
      setStatus(null);
      setIsCalling(false);
    }
  }, [callSession]);

  return {
    isCalling, callSession, startCall, status,
    incomingCall, acceptCall, rejectCall, updateSignalingData,
    signaling, setSignaling
  };
}
