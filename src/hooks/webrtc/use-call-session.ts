
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CallSession, UseCallSessionReturn } from "./types";

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
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, signaling]);

  const handleInsertEvent = (newRow: Partial<CallSession>, currentUserId: string) => {
    if (newRow.status === "pending" && newRow.recipient_id === currentUserId) {
      setIncomingCall(newRow as CallSession);
      setStatus("incoming");
      
      if (callSession?.status === "connected") {
        // Auto-reject if already in a call
        // This needs to be handled by the parent component that has access to rejectCall
        console.log("Already in a call, should auto-reject incoming call");
        // We'll let the parent component handle this via the incomingCall state
      }
    } else if (newRow.caller_id === currentUserId) {
      setCallSession(newRow as CallSession);
      setStatus(newRow.status || null);
    }
  };

  const handleUpdateEvent = (
    newRow: Partial<CallSession>, 
    currentUserId: string,
    currentSignaling: any
  ) => {
    if ((newRow.caller_id === currentUserId || newRow.recipient_id === currentUserId)) {
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
  };

  const handleCallStatus = (status: string | undefined) => {
    if (status === "connected") {
      setIsCalling(true);
      setIncomingCall(null);
      toast.success("Call connected");
    } else if (status === "ended") {
      setIsCalling(false);
      setIncomingCall(null);
      toast.info("Call ended");
    } else if (status === "rejected") {
      setIsCalling(false);
      setIncomingCall(null);
      toast.error("Call rejected");
    } else if (status === "missed") {
      setIsCalling(false);
      setIncomingCall(null);
      toast.error("Call missed");
    }
  };

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
  };
}
