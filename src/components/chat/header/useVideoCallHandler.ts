
import { useState, useMemo } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { toast } from "sonner";

export function useVideoCallHandler(conversationId: string) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find(p => p.id !== profile.id);
  }, [conversation, profile]);

  const roomId = useMemo(() => {
    const convoId = conversation?.id ?? "whispr123";
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

  // Only show dialog if INVITE is pending (for receiver)
  const inviteDialogOpen = !!invitation && invitation.status === "pending";
  // Only show outgoing call dialog if I am calling someone
  const outgoingDialogOpen = !!outgoingInvitation && outgoingInvitation.status === "pending";
  // Show call window if either invite is accepted (either incoming or outgoing accepted)
  const callAccepted =
    (invitation && invitation.status === "accepted") ||
    (outgoingInvitation && outgoingInvitation.status === "accepted");

  // Unified show/hide logic for the video call window
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  // Open/show the call window when accepted
  if (callAccepted && !videoDialogOpen) {
    setVideoDialogOpen(true);
  }
  // Close the call window if both invitations are cleared
  if (!callAccepted && videoDialogOpen) {
    setVideoDialogOpen(false);
  }

  const handleCloseCallDialog = () => {
    setVideoDialogOpen(false);
    clear();
  };

  const handleStartCall = async () => {
    if (!recipient?.id) {
      toast.error("No recipient found for call");
      return;
    }
    try {
      await sendInvitation(recipient.id, roomId);
    } catch (err) {
      toast.error("Failed to send video call invitation");
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    const success = await respondInvitation(invitation.id, accept);
    if (accept && success) {
      setVideoDialogOpen(true);
    } else if (!accept) {
      toast.info("Video call invitation rejected");
      clear();
      setVideoDialogOpen(false);
    }
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    toast.info("Call cancelled");
    clear();
    setVideoDialogOpen(false);
  };

  return {
    videoDialogOpen,
    inviteLoading,
    invitation,
    outgoingInvitation,
    recipient,
    conversation,
    roomId,
    inviteDialogOpen,
    outgoingDialogOpen,
    handleCloseCallDialog,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing
  };
}
