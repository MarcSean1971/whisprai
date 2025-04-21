
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CallSession, UseCallSessionReturn } from "./types";
import { useMessageSound } from "@/hooks/use-message-sound";

export function useCallSession(
  conversationId: string,
  currentUserId: string
): UseCallSessionReturn {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [signaling, setSignaling] = useState<any>(null);
  const [remoteSignal, setRemoteSignal] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const { playRingtoneSound } = useMessageSound();
  const [stopRingtone, setStopRingtone] = useState<(() => void) | null>(null);

  // Reset call state function
  const resetCallState = useCallback(() => {
    console.log("[WebRTC] Resetting call state");
    setIsCalling(false);
    setIncomingCall(null);
    setSignaling(null);
    setRemoteSignal(null);
    
    // Stop ringtone if playing
    if (stopRingtone) {
      stopRingtone();
      setStopRingtone(null);
    }
  }, [stopRingtone]);

  // Handle call status changes
  const handleCallStatus = useCallback((status: string | undefined) => {
    if (status === "connected") {
      setIsCalling(true);
      setIncomingCall(null);
      
      // Stop ringtone if playing
      if (stopRingtone) {
        stopRingtone();
        setStopRingtone(null);
      }
      
      toast.success("Call connected");
    } else if (status === "ended") {
      resetCallState();
      toast.info("Call ended");
    } else if (status === "rejected") {
      resetCallState();
      toast.error("Call rejected");
    } else if (status === "missed") {
      resetCallState();
      toast.error("Call missed");
    } else if (status === "pending") {
      // Start ringtone for incoming calls
      if (!stopRingtone && incomingCall) {
        const stopSound = playRingtoneSound();
        setStopRingtone(() => stopSound);
      }
    }
  }, [incomingCall, playRingtoneSound, resetCallState, stopRingtone]);

  // Subscribe to real-time updates for call_sessions
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`calls:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_sessions",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const eventType = payload?.eventType;
          const newRow = payload?.new as Partial<CallSession> | null;
          
          if (!newRow) return;
          
          console.log("Call session update:", { eventType, newRow });

          if (eventType === "INSERT") {
            handleInsertEvent(newRow, currentUserId);
          } else if (eventType === "UPDATE") {
            handleUpdateEvent(newRow, currentUserId, signaling);
          }
        }
      )
      .subscribe();

    fetchCallHistory();

    return () => {
      if (stopRingtone) {
        stopRingtone();
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, signaling, stopRingtone]);

  const handleInsertEvent = useCallback((newRow: Partial<CallSession>, currentUserId: string) => {
    if (newRow.status === "pending" && newRow.recipient_id === currentUserId) {
      console.log("[WebRTC] Incoming call detected");
      setIncomingCall(newRow as CallSession);
      setStatus("incoming");
      
      // Start ringtone for incoming calls
      if (!stopRingtone) {
        const stopSound = playRingtoneSound();
        setStopRingtone(() => stopSound);
      }
      
      if (callSession?.status === "connected") {
        // Auto-reject if already in a call
        console.log("Already in a call, should auto-reject incoming call");
      }
    } else if (newRow.caller_id === currentUserId) {
      console.log("[WebRTC] Call session created by current user");
      setCallSession(newRow as CallSession);
      setStatus(newRow.status || null);
      setIsCalling(true);
    }
  }, [callSession, playRingtoneSound, stopRingtone]);

  const handleUpdateEvent = useCallback((
    newRow: Partial<CallSession>, 
    currentUserId: string,
    currentSignaling: any
  ) => {
    if ((newRow.caller_id === currentUserId || newRow.recipient_id === currentUserId)) {
      console.log("[WebRTC] Call session updated:", newRow.status);
      setCallSession(newRow as CallSession);
      setStatus(newRow.status || null);
      
      handleCallStatus(newRow.status);
      
      if (newRow.signaling_data && newRow.signaling_data !== currentSignaling) {
        const isFromOther = 
          (newRow.caller_id !== currentUserId && newRow.caller_id) || 
          (newRow.recipient_id !== currentUserId && newRow.recipient_id);
          
        if (isFromOther) {
          console.log("Received remote signal from the other party");
          setRemoteSignal(newRow.signaling_data);
        }
      }
    }
  }, [handleCallStatus]);

  const fetchCallHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching call history:", error);
        return;
      }
      
      if (data) {
        setCallHistory(data as CallSession[]);
      }
    } catch (err) {
      console.error("Failed to fetch call history:", err);
    }
  };

  return {
    isCalling,
    callSession,
    incomingCall,
    status,
    signaling,
    setSignaling,
    remoteSignal,
    callHistory,
    resetCallState
  };
}
