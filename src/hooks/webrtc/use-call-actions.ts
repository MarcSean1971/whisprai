
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CallSession, UseCallActionsReturn } from "./types";

export function useCallActions(
  conversationId: string,
  currentUserId: string,
  otherUserId: string,
  incomingCall: CallSession | null,
  fetchCallHistory: () => Promise<void>
): UseCallActionsReturn {
  const startCall = useCallback(
    async (callType: "audio" | "video" = "audio") => {
      try {
        // Check for existing active call
        const { data: existingCall } = await supabase
          .from("call_sessions")
          .select("*")
          .eq("conversation_id", conversationId)
          .in("status", ["pending", "connected"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingCall) {
          const now = new Date();
          const createdAt = new Date(existingCall.created_at);
          const updatedAt = new Date(existingCall.updated_at);
          
          if (
            (existingCall.status === "pending" && now.getTime() - createdAt.getTime() > 30000) ||
            (existingCall.status === "connected" && now.getTime() - updatedAt.getTime() > 120000)
          ) {
            await endCall(existingCall.id, "ended");
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            toast.error("There's already an active call in this conversation");
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
          toast.error("Failed to start call.");
          return null;
        }

        toast.success("Calling...");

        // Set up auto-missed call after 30 seconds
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
        toast.error("Could not create call session.");
        return null;
      }
    },
    [conversationId, currentUserId, otherUserId]
  );

  const updateSignalingData = useCallback(
    async (sessionId: string, signalingObj: any) => {
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
    []
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "connected", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
      
    if (error) {
      toast.error("Failed to accept call.");
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
  }, [incomingCall]);

  const endCall = useCallback(async (sessionId?: string, endStatus: 'ended' | 'missed' = 'ended') => {
    if (!sessionId) return;
    
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: endStatus, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
      
    if (error) {
      toast.error("Failed to end call.");
    } else {
      fetchCallHistory();
    }
  }, [fetchCallHistory]);

  return {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    updateSignalingData,
  };
}

