
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCallTerminator(fetchCallHistory: () => Promise<void>) {
  const endCall = useCallback(async (sessionId?: string, endStatus: 'ended' | 'missed' = 'ended') => {
    if (!sessionId) {
      console.error("[WebRTC] No session ID provided for call termination");
      return;
    }
    
    console.log(`[WebRTC] Ending call (${sessionId}) with status: ${endStatus}`);
    
    try {
      // First update the session in the database
      const { error } = await supabase
        .from("call_sessions")
        .update({ 
          status: endStatus, 
          updated_at: new Date().toISOString(),
          signaling_data: null
        })
        .eq("id", sessionId);
        
      if (error) {
        console.error("[WebRTC] Failed to end call:", error);
        toast.error("Failed to end call");
        return;
      }
      
      // Show a toast notification
      toast.info(endStatus === 'ended' ? "Call ended" : "Call missed");
      
      // Refresh call history
      await fetchCallHistory();
      
      console.log(`[WebRTC] Call session ${sessionId} successfully marked as ${endStatus}`);
      return { success: true };
    } catch (err) {
      console.error("[WebRTC] Error ending call:", err);
      toast.error("Failed to end call");
      return { success: false, error: err };
    }
  }, [fetchCallHistory]);

  return { endCall };
}
