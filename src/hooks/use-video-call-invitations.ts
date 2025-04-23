
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export interface VideoCallInvitation {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  room_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function useVideoCallInvitations(
  conversationId: string,
  profileId: string | null
) {
  const [invitation, setInvitation] = useState<VideoCallInvitation | null>(null);
  const [outgoingInvitation, setOutgoingInvitation] = useState<VideoCallInvitation | null>(null);
  const [loading, setLoading] = useState(false);

  // Incoming subscriptions - am I the recipient?
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
            if (
              (payload.eventType === "INSERT" ||
                payload.eventType === "UPDATE") &&
              data.status === "pending"
            ) {
              setInvitation(data);
            } else if (
              (payload.eventType === "UPDATE" && data.status !== "pending") ||
              payload.eventType === "DELETE"
            ) {
              setInvitation(null);
            }
          }
        }
      )
      .subscribe();

    // Initial fetch for any pending incoming invite
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("video_call_invitations")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("recipient_id", profileId)
        .eq("status", "pending")
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

  // Outgoing subscription - am I the sender?
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
            // Outgoing: Show "calling" while status pending, clear/cancel otherwise
            if (
              (payload.eventType === "INSERT" ||
                payload.eventType === "UPDATE") &&
              data.status === "pending"
            ) {
              setOutgoingInvitation(data);
            } else if (
              (payload.eventType === "UPDATE" && data.status !== "pending") ||
              payload.eventType === "DELETE"
            ) {
              setOutgoingInvitation(null);
            }
          }
        }
      )
      .subscribe();

    // Initial fetch for any outgoing pending invite
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("video_call_invitations")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("sender_id", profileId)
        .eq("status", "pending")
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

  // Send new invitation (caller)
  const sendInvitation = useCallback(
    async (recipientId: string, roomId: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("video_call_invitations")
        .insert({
          conversation_id: conversationId,
          sender_id: profileId,
          recipient_id: recipientId,
          room_id: roomId,
          status: "pending",
        });
      setLoading(false);
      if (error) throw error;
      return data;
    },
    [conversationId, profileId]
  );

  // Accept/reject/cancel
  const respondInvitation = useCallback(
    async (id: string, accepted: boolean) => {
      setLoading(true);
      const { error } = await supabase
        .from("video_call_invitations")
        .update({
          status: accepted ? "accepted" : "rejected",
        })
        .eq("id", id);
      setLoading(false);
      setInvitation(null);
      setOutgoingInvitation(null);
      return !error;
    },
    []
  );

  // Cancel outgoing (sender)
  const cancelOutgoing = useCallback(async (id: string) => {
    setLoading(true);
    await supabase.from("video_call_invitations").delete().eq("id", id);
    setLoading(false);
    setOutgoingInvitation(null);
  }, []);

  // Clear expired invites on mount
  useEffect(() => {
    const cleanExpired = async () => {
      if (!profileId) return;
      await supabase
        .from("video_call_invitations")
        .delete()
        .lt("expires_at", new Date().toISOString());
    };
    cleanExpired();
  }, [profileId]);

  return {
    invitation, // incoming
    outgoingInvitation, // outgoing for caller
    sendInvitation,
    respondInvitation,
    cancelOutgoing,
    loading,
    clear: () => {
      setInvitation(null);
      setOutgoingInvitation(null);
    },
  };
}
