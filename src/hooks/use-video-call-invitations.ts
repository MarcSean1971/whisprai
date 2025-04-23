
import { useCallback } from "react";
import { useIncomingVideoCallInvitations } from "./video-call-invitations/useIncomingVideoCallInvitations";
import { useOutgoingVideoCallInvitations } from "./video-call-invitations/useOutgoingVideoCallInvitations";
import { useSendVideoCallInvitation } from "./video-call-invitations/useSendVideoCallInvitation";
import { useRespondToVideoCallInvitation } from "./video-call-invitations/useRespondToVideoCallInvitation";
import { useCancelOutgoingInvitation } from "./video-call-invitations/useCancelOutgoingInvitation";
import { useExpiredInvitationsCleanup } from "./video-call-invitations/useExpiredInvitationsCleanup";
import { useClearVideoCallInvitations } from "./video-call-invitations/useClearVideoCallInvitations";
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
  const { sendInvitation, loading: sendLoading } = useSendVideoCallInvitation(conversationId, profileId);
  const { respondInvitation, loading: respondLoading } = useRespondToVideoCallInvitation();
  const { cancelOutgoing, loading: cancelLoading } = useCancelOutgoingInvitation(setOutgoingInvitation);

  useExpiredInvitationsCleanup(profileId);
  const clear = useClearVideoCallInvitations(setInvitation, setOutgoingInvitation);

  const endCall = useCallback(async (id: string) => {
    await supabase
      .from("video_call_invitations")
      .update({ status: "ended" })
      .eq("id", id);
  }, []);

  const loading = sendLoading || respondLoading || cancelLoading;

  return {
    invitation,
    outgoingInvitation,
    sendInvitation,
    respondInvitation: useCallback(async (id: string, accepted: boolean) => {
      const ok = await respondInvitation(id, accepted);
      if (!accepted) {
        setInvitation(null);
        setOutgoingInvitation(null);
      }
      return ok;
    }, [respondInvitation, setInvitation, setOutgoingInvitation]),
    cancelOutgoing,
    loading,
    clear,
    endCall
  };
}
