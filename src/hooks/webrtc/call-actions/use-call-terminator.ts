
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCallTerminator(fetchCallHistory: () => Promise<void>) {
  const endCall = useCallback(async (sessionId?: string, endStatus: 'ended' | 'missed' = 'ended') => {
    if (!sessionId) {
      console.error("[WebRTC] No session ID provided for call termination");
      return;
    }
    
    console.log("[WebRTC] Ending call with immediate cleanup");
    
    try {
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
      
      toast.info(endStatus === 'ended' ? "Call ended" : "Call missed");
      await fetchCallHistory();
    } catch (err) {
      console.error("[WebRTC] Error ending call:", err);
      toast.error("Failed to end call");
    }
  }, [fetchCallHistory]);

  return { endCall };
}
