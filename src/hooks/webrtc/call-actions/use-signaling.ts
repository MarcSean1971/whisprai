
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSignaling() {
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
        console.error("[WebRTC] Failed to send signaling data:", error);
      }
    },
    []
  );

  return { updateSignalingData };
}
