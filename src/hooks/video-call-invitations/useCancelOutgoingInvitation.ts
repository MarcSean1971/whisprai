
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCancelOutgoingInvitation(setOutgoing: (value: any) => void) {
  const [loading, setLoading] = useState(false);

  const cancelOutgoing = useCallback(async (id: string) => {
    setLoading(true);
    await supabase.from("video_call_invitations").delete().eq("id", id);
    setLoading(false);
    setOutgoing(null);
  }, [setOutgoing]);

  return { cancelOutgoing, loading, setLoading };
}
