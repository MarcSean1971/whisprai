
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CallSession } from "../types";

interface UseCallResponseProps {
  incomingCall: CallSession | null;
  fetchCallHistory: () => Promise<void>;
  stopRingtone?: (() => void) | null;
}

export function useCallResponse({ incomingCall, fetchCallHistory, stopRingtone }: UseCallResponseProps) {
  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.error("[WebRTC] No incoming call to accept");
      return;
    }
    
    console.log("[WebRTC] Accepting call immediately");
    
    // First silence ringtone immediately to improve user experience
    if (stopRingtone) {
      console.log("[WebRTC] Stopping ringtone immediately on accept");
      stopRingtone();
    }
    
    try {
      // Update call status to connected in a single atomic operation
      // Skip the connecting state to avoid race conditions
      const { error } = await supabase
        .from("call_sessions")
        .update({ 
          status: "connected", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", incomingCall.id);
        
      if (error) {
        console.error("[WebRTC] Failed to accept call:", error);
        toast.error("Failed to accept call");
        return;
      }

      console.log("[WebRTC] Call marked as connected in database");
    } catch (err) {
      console.error("[WebRTC] Error accepting call:", err);
      toast.error("Failed to accept call");
    }
  }, [incomingCall, stopRingtone]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      console.error("[WebRTC] No incoming call to reject");
      return;
    }
    
    console.log("[WebRTC] Rejecting call with immediate cleanup");
    
    // First silence ringtone immediately to improve user experience
    if (stopRingtone) {
      console.log("[WebRTC] Stopping ringtone immediately on reject");
      stopRingtone();
    }
    
    try {
      // Before updating database, make sure we have session ID captured to avoid race conditions
      const sessionId = incomingCall.id;
      
      const { error } = await supabase
        .from("call_sessions")
        .update({ 
          status: "rejected", 
          updated_at: new Date().toISOString(),
          signaling_data: null
        })
        .eq("id", sessionId);
        
      if (error) {
        console.error("[WebRTC] Failed to reject call:", error);
        toast.error("Failed to reject call");
        return;
      }
      
      toast.info("Call rejected");
      await fetchCallHistory();
    } catch (err) {
      console.error("[WebRTC] Error rejecting call:", err);
      toast.error("Failed to reject call");
    }
  }, [incomingCall, fetchCallHistory, stopRingtone]);

  return { acceptCall, rejectCall };
}
