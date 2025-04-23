
import { useState, useMemo, useEffect, useRef } from "react";
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

  // Handles video dialog opening when call is accepted
  useEffect(() => {
    if (callAccepted) {
      setVideoDialogOpen(true);
    } else {
      setVideoDialogOpen(false);
    }
  }, [callAccepted]);

  // --- Fix: Only close dialog (and show cancellation toast) when invitation is REMOVED (not just accepted!) ---
  const prevInviteDialogOpen = useRef(inviteDialogOpen);

  useEffect(() => {
    // Only react if the dialog was open and now it's closed, and invitation was REMOVED (not just accepted)
    if (prevInviteDialogOpen.current && !inviteDialogOpen) {
      if (
        // Invitation is now null (cancelled or deleted remotely)
        invitation === null
      ) {
        toast.info("The caller has cancelled the video call invitation.");
        clear();
        setVideoDialogOpen(false);
      }
      // If invitation exists and is accepted, DO NOT close anything here!
    }
    prevInviteDialogOpen.current = inviteDialogOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteDialogOpen, invitation]);

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
      // Video dialog will open via effect above (callAccepted = true)
      // No need to clear or close here.
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
