
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useExpiredInvitationsCleanup(profileId: string | null) {
  useEffect(() => {
    if (!profileId) return;
    const cleanExpired = async () => {
      await supabase
        .from("video_call_invitations")
        .delete()
        .lt("expires_at", new Date().toISOString());
    };
    cleanExpired();
  }, [profileId]);
}
