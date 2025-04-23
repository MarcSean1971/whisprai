
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VideoCallInvitation } from "../use-video-call-invitations";

export function useOutgoingVideoCallInvitations(conversationId: string, profileId: string | null) {
  const [outgoingInvitation, setOutgoingInvitation] = useState<VideoCallInvitation | null>(null);

  useEffect(() => {
    if (!conversationId || !profileId) return;

    const channel = supabase
      .channel(`video-invitations-outgoing-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_call_invitations",
          filter: `sender_id=eq.${profileId}`,
        },
        async (payload) => {
          const data = (payload.eventType === "DELETE"
            ? payload.old
            : payload.new) as VideoCallInvitation;
          if (
            data?.sender_id === profileId &&
            data?.conversation_id === conversationId
          ) {
            // Only show if the status is 'pending'
            if (
              (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
              (data.status === "pending" || data.status === "accepted")
            ) {
              setOutgoingInvitation(data);
            } else if (
              (payload.eventType === "UPDATE" && 
              ["cancelled", "rejected", "ended"].includes(data.status)) ||
              payload.eventType === "DELETE"
            ) {
              setOutgoingInvitation(null);
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
        .eq("sender_id", profileId)
        .in("status", ["pending", "accepted"])
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setOutgoingInvitation(data as VideoCallInvitation);
      else setOutgoingInvitation(null);
    };
    fetchInitial();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  return { outgoingInvitation, setOutgoingInvitation };
}
