
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

  const resetCallState = useCallback(() => {
    console.log("[WebRTC] Resetting call state - full cleanup");
    setIsCalling(false);
    setIncomingCall(null);
    setSignaling(null);
    setRemoteSignal(null);
    setStatus(null);
    
    // Always stop ringtone when resetting state
    if (stopRingtone) {
      console.log("[WebRTC] Stopping ringtone in resetCallState");
      stopRingtone();
      setStopRingtone(null);
    }
  }, [stopRingtone]);

  const handleCallStatus = useCallback((status: string | undefined) => {
    console.log(`[WebRTC] Call status change: ${status}`);
    setStatus(status || null);
    
    if (status === "connected") {
      console.log("[WebRTC] Call connected, updating state immediately");
      setIsCalling(true);
      setIncomingCall(null);
      
      // Always stop ringtone when call status changes to connected
      if (stopRingtone) {
        console.log("[WebRTC] Stopping ringtone for connected call");
        stopRingtone();
        setStopRingtone(null);
      }
      
      toast.success("Call connected");
    } else if (status === "ended" || status === "rejected") {
      console.log(`[WebRTC] Call ${status}, running full cleanup`);
      resetCallState();
      toast.info(status === "ended" ? "Call ended" : "Call rejected");
    } else if (status === "missed") {
      console.log("[WebRTC] Call missed, running full cleanup");
      resetCallState();
      toast.error("Call missed");
    } else if (status === "pending") {
      // Only start ringtone if:
      // 1. We don't already have a ringtone playing
      // 2. There's an incoming call
      // 3. We're not already in a call
      if (!stopRingtone && incomingCall && !isCalling) {
        console.log("[WebRTC] Starting ringtone for pending call");
        const stopSound = playRingtoneSound();
        setStopRingtone(() => stopSound);
      }
    }
  }, [incomingCall, isCalling, playRingtoneSound, resetCallState, stopRingtone]);

  // Automatically fetch call history when component mounts
  useEffect(() => {
    if (conversationId) {
      fetchCallHistory();
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    console.log(`[WebRTC] Setting up realtime subscription for calls in conversation: ${conversationId}`);
    
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
          
          console.log("[WebRTC] Call session update:", { eventType, newRow });

          if (eventType === "INSERT") {
            handleInsertEvent(newRow, currentUserId);
          } else if (eventType === "UPDATE") {
            handleUpdateEvent(newRow, currentUserId, signaling);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[WebRTC] Cleaning up realtime subscription and ringtone");
      if (stopRingtone) {
        stopRingtone();
        setStopRingtone(null);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, signaling, stopRingtone]);

  const handleInsertEvent = useCallback((newRow: Partial<CallSession>, currentUserId: string) => {
    if (newRow.status === "pending" && newRow.recipient_id === currentUserId) {
      console.log("[WebRTC] Incoming call detected:", { 
        callType: newRow.call_type,
        callerId: newRow.caller_id,
        status: newRow.status 
      });
      
      setIncomingCall(newRow as CallSession);
      setStatus("incoming");
      setCallSession(newRow as CallSession); // Set call session immediately for incoming calls
      
      // Only start ringtone if we're not already on a call
      if (!isCalling && !stopRingtone) {
        console.log("[WebRTC] Starting ringtone for incoming call");
        const stopSound = playRingtoneSound();
        setStopRingtone(() => stopSound);
      }
      
      if (callSession?.status === "connected") {
        console.log("[WebRTC] Already in a call, should auto-reject incoming call");
      }
    } else if (newRow.caller_id === currentUserId) {
      console.log("[WebRTC] Call session created by current user");
      setCallSession(newRow as CallSession);
      setStatus(newRow.status || null);
      setIsCalling(true);
    }
  }, [callSession, isCalling, playRingtoneSound, stopRingtone]);

  const handleUpdateEvent = useCallback((
    newRow: Partial<CallSession>, 
    currentUserId: string,
    currentSignaling: any
  ) => {
    if ((newRow.caller_id === currentUserId || newRow.recipient_id === currentUserId)) {
      console.log("[WebRTC] Call session updated:", newRow.status);
      setCallSession(newRow as CallSession);
      
      // Always call handleCallStatus to ensure state is properly updated
      handleCallStatus(newRow.status);
      
      if (newRow.signaling_data && newRow.signaling_data !== currentSignaling) {
        const isFromOther = 
          (newRow.caller_id !== currentUserId && newRow.caller_id) || 
          (newRow.recipient_id !== currentUserId && newRow.recipient_id);
          
        if (isFromOther) {
          console.log("[WebRTC] Received remote signal from other party");
          setRemoteSignal(newRow.signaling_data);
        }
      }
    }
  }, [handleCallStatus]);

  const fetchCallHistory = async () => {
    try {
      console.log(`[WebRTC] Fetching call history for conversation: ${conversationId}`);
      const { data, error } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("[WebRTC] Error fetching call history:", error);
        return;
      }
      
      if (data) {
        console.log(`[WebRTC] Found ${data.length} call history records`);
        setCallHistory(data as CallSession[]);
      }
    } catch (err) {
      console.error("[WebRTC] Failed to fetch call history:", err);
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
    resetCallState,
    stopRingtone,
    fetchCallHistory
  };
}
