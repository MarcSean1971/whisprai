
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VideoCallInvitation } from "../use-video-call-invitations";

export function useIncomingVideoCallInvitations(conversationId: string, profileId: string | null) {
  const [invitation, setInvitation] = useState<VideoCallInvitation | null>(null);

  useEffect(() => {
    if (!conversationId || !profileId) return;

    const channel = supabase
      .channel(`video-invitations-incoming-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_call_invitations",
          filter: `recipient_id=eq.${profileId}`,
        },
        async (payload) => {
          const data = (payload.eventType === "DELETE"
            ? payload.old
            : payload.new) as VideoCallInvitation;
          if (
            data?.recipient_id === profileId &&
            data?.conversation_id === conversationId
          ) {
            // Show for both pending and accepted states
            if (
              (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
              (data.status === "pending" || data.status === "accepted")
            ) {
              setInvitation(data);
            } else if (
              (payload.eventType === "UPDATE" && 
              ["cancelled", "rejected", "ended"].includes(data.status)) ||
              payload.eventType === "DELETE"
            ) {
              setInvitation(null);
            }
          }
        }
      )
      .subscribe();

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("video_call_invitations")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("recipient_id", profileId)
        .in("status", ["pending", "accepted"])
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setInvitation(data as VideoCallInvitation);
      else setInvitation(null);
    };
    fetchInitial();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  return { invitation, setInvitation };
}
