
import { useMemo } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";

// Handles state and actions for video call invitations/dialogs
export function useVideoCallHandler(conversationId: string) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find((p) => p.id !== profile.id) || null;
  }, [conversation, profile]);

  // Unique roomId
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

  // Call is shown if there is an outgoing or incoming pending invitation
  const outgoingPending = !!outgoingInvitation && outgoingInvitation.status === "pending";
  const incomingPending = !!invitation && invitation.status === "pending";

  // Start a call (send invite)
  const handleStartCall = async () => {
    if (!recipient?.id) return;
    await sendInvitation(recipient.id, roomId);
  };

  // Respond to invite (accept or reject)
  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    await respondInvitation(invitation.id, accept);
    if (!accept) clear();
  };

  // Cancel outgoing call
  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    clear();
  };

  // API for parent
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
