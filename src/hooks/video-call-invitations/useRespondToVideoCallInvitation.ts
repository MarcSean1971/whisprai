
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRespondToVideoCallInvitation() {
  const [loading, setLoading] = useState(false);

  const respondInvitation = useCallback(
    async (id: string, accepted: boolean) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from("video_call_invitations")
          .update({
            status: accepted ? "accepted" : "rejected",
          })
          .eq("id", id);
        
        setLoading(false);
        return !error;
      } catch (err) {
        console.error("Error responding to invitation:", err);
        setLoading(false);
        return false;
      }
    },
    []
  );

  return { respondInvitation, loading, setLoading };
}
