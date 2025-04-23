
import { useState, useMemo, useEffect } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { toast } from "sonner";

// Main video call handler hook - simplified dialog logic
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

  // Pending dialogs
  const inviteDialogOpen = !!invitation && invitation.status === "pending";
  const outgoingDialogOpen = !!outgoingInvitation && outgoingInvitation.status === "pending";

  // Call is accepted if EITHER invitation/outgoingInvitation is accepted (incoming/outgoing)
  const callAccepted =
    (invitation && invitation.status === "accepted") ||
    (outgoingInvitation && outgoingInvitation.status === "accepted");

  // Dialog for video call open state (synced directly to callAccepted)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Open/close dialog as soon as call is accepted, for BOTH caller & receiver
  useEffect(() => {
    setVideoDialogOpen(callAccepted);
  }, [callAccepted]);

  // Show caller-cancelled toast if incoming invite disappears while expecting a call
  useEffect(() => {
    if (
      !inviteDialogOpen && invitation === null // invite dialog just closed & invitation gone
    ) {
      toast.info("The caller has cancelled the video call invitation.");
      clear();
      setVideoDialogOpen(false);
    }
    // Only triggers if inviteDialogOpen or invitation changes
    // eslint-disable-next-line
  }, [inviteDialogOpen, invitation, clear]);

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
    } catch {
      toast.error("Failed to send video call invitation");
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;

    if (accept) {
      const success = await respondInvitation(invitation.id, true);
      if (!success) {
        toast.error("Failed to accept call");
      } else {
        toast.success("Call accepted");
        // The dialog will open automatically by callAccepted effect
      }
    } else {
      await respondInvitation(invitation.id, false);
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
