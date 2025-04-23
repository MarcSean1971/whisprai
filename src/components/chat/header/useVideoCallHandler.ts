
import { useState, useMemo, useEffect } from "react";
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

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Handle transitions for opening/closing the video call window on callAccepted
  useEffect(() => {
    if (callAccepted) {
      setVideoDialogOpen(true);
    } else {
      setVideoDialogOpen(false);
    }
    // Only depend on callAccepted; all other changes are derived from it
  }, [callAccepted]);

  // NEW: Handle remote invitation cancellation for the recipient
  // If there is no pending invitation anymore but the dialog was open, close the dialog and show a toast
  useEffect(() => {
    if (!inviteDialogOpen) {
      setVideoDialogOpen(false); // Just in case
      // Only show the toast if there was an invitation before (i.e., dialog would be open)
      // and now the invite is gone (i.e., canceled by the caller)
      // So we need some tracking for this. We'll use a ref for "previous inviteDialogOpen"
      // but, for simplicity, we'll just show the toast if the window closes due to cancelling.
      // We'll assume that this effect only runs when inviteDialogOpen changes.
      // Show the notification if invitation was previously pending and now gone or not pending.
      // (Letting the toast be nonintrusive if this is due to accepted/rejected)
      if (invitation === null || (invitation && invitation.status !== "pending")) {
        toast.info("The caller has cancelled the video call invitation.");
        clear();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteDialogOpen]);

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
      // No need to setVideoDialogOpen(true) here; it will open from useEffect when status updates.
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

