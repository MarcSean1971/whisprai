
import { useCallback } from "react";
import { useIncomingVideoCallInvitations } from "./video-call-invitations/useIncomingVideoCallInvitations";
import { useOutgoingVideoCallInvitations } from "./video-call-invitations/useOutgoingVideoCallInvitations";
import { useSendVideoCallInvitation } from "./video-call-invitations/useSendVideoCallInvitation";
import { useRespondToVideoCallInvitation } from "./video-call-invitations/useRespondToVideoCallInvitation";
import { useCancelOutgoingInvitation } from "./video-call-invitations/useCancelOutgoingInvitation";
import { useExpiredInvitationsCleanup } from "./video-call-invitations/useExpiredInvitationsCleanup";
import { useClearVideoCallInvitations } from "./video-call-invitations/useClearVideoCallInvitations";

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

  useExpiredInvitationsCleanup(profileId);
  const clear = useClearVideoCallInvitations(setInvitation, setOutgoingInvitation);

  const loading = sendLoading || respondLoading || cancelLoading;

  return {
    invitation, // incoming
    outgoingInvitation, // outgoing for caller
    sendInvitation,
    respondInvitation: useCallback(async (id: string, accepted: boolean) => {
      const ok = await respondInvitation(id, accepted);
      // Only clear invites if rejected. If accepted, let the real-time update propagate and control dialog/window.
      if (!accepted) {
        setInvitation(null);
        setOutgoingInvitation(null);
      }
      return ok;
    }, [respondInvitation, setInvitation, setOutgoingInvitation]),
    cancelOutgoing,
    loading,
    clear,
  };
}
