import { useMemo } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";

export function useVideoCallHandler(conversationId: string) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find((p) => p.id !== profile.id) || null;
  }, [conversation, profile]);

  const roomId = useMemo(() => {
    const convoId = conversation?.id ?? "room";
    if (profile && recipient) {
      return `${convoId.substring(0, 8)}_${profile.id.substring(0, 8)}_${recipient.id.substring(0, 8)}`;
    }
    return convoId;
  }, [conversation, profile, recipient]);

  const {
    invitation,
    outgoingInvitation,
    sendInvitation,
    respondInvitation,
    cancelOutgoing,
    loading: inviteLoading,
    clear,
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  const outgoingPending = !!outgoingInvitation && outgoingInvitation.status === "pending";
  const incomingPending = !!invitation && invitation.status === "pending";

  const handleStartCall = async () => {
    if (!recipient?.id) return;
    await sendInvitation(recipient.id, roomId);
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    await respondInvitation(invitation.id, accept);
    if (!accept) clear();
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    clear();
  };

  return {
    recipient,
    invitation,
    outgoingInvitation,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing,
    inviteLoading,
    outgoingPending,
    incomingPending,
    conversation,
  };
}
