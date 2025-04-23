import { useCallback, useEffect } from "react";
import { useIncomingVideoCallInvitations } from "./video-call-invitations/useIncomingVideoCallInvitations";
import { useOutgoingVideoCallInvitations } from "./video-call-invitations/useOutgoingVideoCallInvitations";
import { useSendVideoCallInvitation } from "./video-call-invitations/useSendVideoCallInvitation";
import { useRespondToVideoCallInvitation } from "./video-call-invitations/useRespondToVideoCallInvitation";
import { useCancelOutgoingInvitation } from "./video-call-invitations/useCancelOutgoingInvitation";
import { supabase } from "@/integrations/supabase/client";

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

export function useVideoCallInvitations(conversationId: string, profileId: string | null) {
  const { invitation, setInvitation } = useIncomingVideoCallInvitations(conversationId, profileId);
  const { outgoingInvitation, setOutgoingInvitation } = useOutgoingVideoCallInvitations(conversationId, profileId);
  const { sendInvitation, loading: sendLoading, setLoading: setSendLoading } = useSendVideoCallInvitation(conversationId, profileId);
  const { respondInvitation, loading: respondLoading, setLoading: setRespondLoading } = useRespondToVideoCallInvitation();
  const { cancelOutgoing, loading: cancelLoading, setLoading: setCancelLoading } = useCancelOutgoingInvitation(setOutgoingInvitation);

  const loading = sendLoading || respondLoading || cancelLoading;

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

  const clear = useCallback(() => {
    setInvitation(null);
    setOutgoingInvitation(null);
  }, [setInvitation, setOutgoingInvitation]);

  return {
    invitation, // incoming
    outgoingInvitation, // outgoing for caller
    sendInvitation,
    respondInvitation: useCallback(async (id: string, accepted: boolean) => {
      const ok = await respondInvitation(id, accepted);
      setInvitation(null);
      setOutgoingInvitation(null);
      return ok;
    }, [respondInvitation, setInvitation, setOutgoingInvitation]),
    cancelOutgoing,
    loading,
    clear,
  };
}
