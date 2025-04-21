import { useEffect, useState, useCallback } from "react";
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
  new: Partial<CallSession> | null;
  old: Partial<CallSession> | null;
}

/**
 * WebRTC signaling and call logic through Supabase call_sessions.
 * Use this hook to manage call lifecycle: start, receive invitation, respond with signaling, etc.
 */
export function useWebRTCCalls(
  conversationId: string,
  currentUserId: string,
  otherUserId: string
) {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [signaling, setSignaling] = useState<any>(null);
  const [remoteSignal, setRemoteSignal] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);

  // Subscribe to real-time updates for call_sessions on this conversation
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
          // Handle various event types
          const eventType = payload?.eventType;
          const newRow = payload?.new as Partial<CallSession> | null;
          
          if (!newRow) return;
          
          console.log("Call session update:", { eventType, newRow });

          // Handle INSERT events - new calls
          if (eventType === "INSERT") {
            if (newRow.status === "pending" && newRow.recipient_id === currentUserId) {
              // Incoming call
              if (newRow) setIncomingCall(newRow as CallSession);
              setStatus("incoming");
              
              // Auto-reject if already in a call
              if (callSession?.status === "connected") {
                rejectCall();
              }
            } else if (newRow.caller_id === currentUserId) {
              // Outgoing call
              if (newRow) setCallSession(newRow as CallSession);
              setStatus(newRow.status || null);
            }
          } 
          // Handle UPDATE events - status changes
          else if (eventType === "UPDATE") {
            if ((newRow.caller_id === currentUserId || newRow.recipient_id === currentUserId)) {
              if (newRow) {
                setCallSession(newRow as CallSession);
                setStatus(newRow.status || null);
                
                // Handle session statuses
                if (newRow.status === "connected") {
                  setIsCalling(true);
                  setIncomingCall(null);
                  toast.success("Call connected");
                } else if (newRow.status === "ended") {
                  setIsCalling(false);
                  setIncomingCall(null);
                  toast.info("Call ended");
                } else if (newRow.status === "rejected") {
                  setIsCalling(false);
                  setIncomingCall(null);
                  if (newRow.caller_id === currentUserId) {
                    toast.error("Call rejected");
                  }
                } else if (newRow.status === "missed") {
                  setIsCalling(false);
                  setIncomingCall(null);
                  if (newRow.caller_id === currentUserId) {
                    toast.error("Call missed");
                  }
                }
                
                // Check for signaling data updates from the other party
                if (newRow.signaling_data && newRow.signaling_data !== signaling) {
                  // Only set the remote signal if it comes from the other user
                  const isFromOther = 
                    (newRow.caller_id !== currentUserId && newRow.caller_id) || 
                    (newRow.recipient_id !== currentUserId && newRow.recipient_id);
                    
                  if (isFromOther) {
                    console.log("Received remote signal from the other party");
                    setRemoteSignal(newRow.signaling_data);
                  }
                }
              }
            }
          }
        }
      )
      .subscribe();

    // Fetch recent call history
    fetchCallHistory();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, signaling]);

  // Fetch call history for this conversation
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

  // Updated: Check for and auto-end stale active calls before starting a new call
  const startCall = useCallback(
    async (callType: "audio" | "video" = "audio") => {
      setIsCalling(true);
      try {
        // Check for existing active call in this conversation
        const { data: existingCall } = await supabase
          .from("call_sessions")
          .select("*")
          .eq("conversation_id", conversationId)
          .in("status", ["pending", "connected"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // If there is an active call, check if we can auto-close it
        if (existingCall) {
          const now = new Date();
          const createdAt = new Date(existingCall.created_at);
          const updatedAt = new Date(existingCall.updated_at);
          let shouldClose = false;

          // Define staleness:
          // - pending more than 30s old
          // - connected but no update more than 2min
          if (
            (existingCall.status === "pending" && now.getTime() - createdAt.getTime() > 30000) ||
            (existingCall.status === "connected" && now.getTime() - updatedAt.getTime() > 120000)
          ) {
            shouldClose = true;
          }

          if (shouldClose && existingCall.id) {
            // Auto-end the stale session
            await supabase
              .from("call_sessions")
              .update({ status: "ended", updated_at: new Date().toISOString() })
              .eq("id", existingCall.id);
            toast.info("Previous stale call has been auto-ended. Trying to start a new call...");
            // Wait a moment after updating
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            toast.error("There's already an active call in this conversation");
            setIsCalling(false);
            return null;
          }
        }

        const { data: stillExistingCall } = await supabase
          .from("call_sessions")
          .select("*")
          .eq("conversation_id", conversationId)
          .in("status", ["pending", "connected"])
          .single();

        if (stillExistingCall) {
          toast.error("There's already an active call in this conversation");
          setIsCalling(false);
          return null;
        }

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
        toast.success("Calling...");

        setTimeout(async () => {
          const { data: currentSession } = await supabase
            .from("call_sessions")
            .select("status")
            .eq("id", data.id)
            .single();

          if (currentSession?.status === "pending") {
            endCall(data.id, "missed");
            toast.error("Call not answered");
          }
        }, 30000);

        return data;
      } catch (err) {
        setIsCalling(false);
        toast.error("Could not create call session.");
        return null;
      }
    },
    [conversationId, currentUserId, otherUserId]
  );

  const updateSignalingData = useCallback(
    async (sessionId: string, signalingObj: any) => {
      // Don't update if it's the same object (prevents loops)
      if (JSON.stringify(signalingObj) === JSON.stringify(signaling)) {
        return;
      }
      
      setSignaling(signalingObj);
      
      // Post updated SDP/candidate to the DB
      const { error } = await supabase
        .from("call_sessions")
        .update({
          signaling_data: signalingObj,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
        
      if (error) {
        console.error("Failed to send signaling data:", error);
      }
    },
    [signaling]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "connected", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
      
    if (error) {
      toast.error("Failed to accept call.");
    } else {
      setStatus("connected");
    }
  }, [incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
      
    if (error) {
      toast.error("Failed to reject call.");
    }
    
    setIncomingCall(null);
    setStatus("rejected");
  }, [incomingCall]);

  const endCall = useCallback(async (sessionId?: string, endStatus: 'ended' | 'missed' = 'ended') => {
    const id = sessionId || callSession?.id;
    
    if (!id) return;
    
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: endStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
      
    if (error) {
      toast.error("Failed to end call.");
    } else {
      setCallSession(null);
      setStatus(null);
      setIsCalling(false);
      setIncomingCall(null);
      setRemoteSignal(null);
      setSignaling(null);
      
      // Refresh call history
      fetchCallHistory();
    }
  }, [callSession]);

  useEffect(() => {
    // Auto-clear ended call session
    if (
      callSession &&
      ["ended", "rejected", "missed"].includes(callSession.status)
    ) {
      setCallSession(null);
      setStatus(null);
      setIsCalling(false);
    }
  }, [callSession]);

  return {
    isCalling,
    callSession,
    startCall,
    status,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
    updateSignalingData,
    signaling,
    setSignaling,
    remoteSignal,
    callHistory,
  };
}
