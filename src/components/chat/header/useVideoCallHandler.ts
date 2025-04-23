
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
  
  // Track if we've explicitly accepted a call to prevent false cancellation messages
  const [hasExplicitlyAccepted, setHasExplicitlyAccepted] = useState(false);

  // Handles video dialog opening when call is accepted
  useEffect(() => {
    if (callAccepted) {
      setVideoDialogOpen(true);
    } else {
      setVideoDialogOpen(false);
    }
  }, [callAccepted]);

  // Only track true cancellations, not transitions to accepted state
  const prevInviteDialogOpen = useRef(inviteDialogOpen);
  const prevInvitation = useRef(invitation);

  useEffect(() => {
    // We only care about the case where:
    // 1. Dialog was previously open
    // 2. Dialog is now closed
    // 3. This is NOT due to an acceptance (we check hasExplicitlyAccepted)
    if (prevInviteDialogOpen.current && !inviteDialogOpen && !hasExplicitlyAccepted) {
      // The invitation disappeared (was null or deleted) and was NOT due to our acceptance
      if (invitation === null && prevInvitation.current !== null) {
        toast.info("The caller has cancelled the video call invitation.");
        clear();
        setVideoDialogOpen(false);
      }
    }
    
    // Reset the acceptance flag when the invitation changes
    if (invitation !== prevInvitation.current) {
      setHasExplicitlyAccepted(false);
    }
    
    prevInviteDialogOpen.current = inviteDialogOpen;
    prevInvitation.current = invitation;
  }, [inviteDialogOpen, invitation, clear, hasExplicitlyAccepted]);

  const handleCloseCallDialog = () => {
    setVideoDialogOpen(false);
    clear();
    setHasExplicitlyAccepted(false);
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
    
    if (accept) {
      // Mark that we've explicitly accepted to prevent showing cancellation toast
      setHasExplicitlyAccepted(true);
      const success = await respondInvitation(invitation.id, true);
      if (success) {
        toast.success("Call accepted");
        // Video dialog will open via the callAccepted effect
      } else {
        toast.error("Failed to accept call");
        setHasExplicitlyAccepted(false);
      }
    } else {
      // For rejections, continue with existing behavior
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
