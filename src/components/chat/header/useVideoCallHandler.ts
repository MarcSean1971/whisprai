
import { useMemo, useState } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";

// HUGELY simplified: No side effects, no toasts, just logic
export function useVideoCallHandler(conversationId: string) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find(p => p.id !== profile.id);
  }, [conversation, profile]);

  const roomId = useMemo(() => {
    const convoId = conversation?.id ?? "room";
    if (profile && recipient) {
      return `${convoId.substr(0, 8)}_${profile.id.substr(0, 8)}_${recipient.id.substr(0, 8)}`;
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
    clear
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  // Track if video call dialog should be open
  let videoDialogOpen = false;
  let videoDialogRoomId = roomId;
  if (invitation && invitation.status === "accepted") {
    videoDialogOpen = true;
    videoDialogRoomId = invitation.room_id;
  }
  if (outgoingInvitation && outgoingInvitation.status === "accepted") {
    videoDialogOpen = true;
    videoDialogRoomId = outgoingInvitation.room_id;
  }

  // Very simple state for answering or calling
  const outgoingPending = !!outgoingInvitation && outgoingInvitation.status === "pending";
  const incomingPending = !!invitation && invitation.status === "pending";

  // Instantly send invitation
  const handleStartCall = async () => {
    if (!recipient?.id) return;
    await sendInvitation(recipient.id, roomId);
  };

  // Instantly respond to invitation
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

  const handleCloseCallDialog = () => {
    clear();
  };

  return {
    videoDialogOpen,
    videoDialogRoomId,
    inviteLoading,
    incomingPending,
    outgoingPending,
    recipient,
    conversation,
    handleCloseCallDialog,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing,
    invitation,
    outgoingInvitation
  };
}
