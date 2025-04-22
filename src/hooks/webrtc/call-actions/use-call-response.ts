
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CallSession } from "../types";

interface UseCallResponseProps {
  incomingCall: CallSession | null;
  fetchCallHistory: () => Promise<void>;
}

export function useCallResponse({ incomingCall, fetchCallHistory }: UseCallResponseProps) {
  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.error("[WebRTC] No incoming call to accept");
      return;
    }
    
    console.log("[WebRTC] Accepting call immediately");
    
    try {
      // First mark call as connecting to show proper UI state
      const { error: updateError } = await supabase
        .from("call_sessions")
        .update({ 
          status: "connecting", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", incomingCall.id);
        
      if (updateError) {
        console.error("[WebRTC] Failed to mark call as connecting:", updateError);
        toast.error("Failed to accept call");
        return;
      }

      // Short delay to ensure the UI state is updated before trying connection
      setTimeout(async () => {
        // Then mark call as connected to trigger peer connection
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
      }, 500);
    } catch (err) {
      console.error("[WebRTC] Error accepting call:", err);
      toast.error("Failed to accept call");
    }
  }, [incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      console.error("[WebRTC] No incoming call to reject");
      return;
    }
    
    console.log("[WebRTC] Rejecting call with immediate cleanup");
    
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
  }, [incomingCall, fetchCallHistory]);

  return { acceptCall, rejectCall };
}
