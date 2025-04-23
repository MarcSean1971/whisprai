
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSendVideoCallInvitation(conversationId: string, profileId: string | null) {
  const [loading, setLoading] = useState(false);

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

  return { sendInvitation, loading, setLoading };
}
