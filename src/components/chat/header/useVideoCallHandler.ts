
import { useState, useRef, useEffect, useMemo } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { toast } from "sonner";

export function useVideoCallHandler(conversationId: string) {
  const [showVideoCall, setShowVideoCall] = useState(false);

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

  // Robustly control showing/hiding of the VideoCallDialog
  const prevInvitationRef = useRef(invitation);
  const prevOutgoingRef = useRef(outgoingInvitation);

  useEffect(() => {
    // If incoming invite was cleared (call cancelled)
    if (
      prevInvitationRef.current &&
      prevInvitationRef.current.status === "pending" &&
      !invitation
    ) {
      toast.info("Call cancelled");
      setShowVideoCall(false);
    }
    prevInvitationRef.current = invitation;
  }, [invitation]);

  useEffect(() => {
    // Outgoing accepted: show dialog
    if (
      outgoingInvitation &&
      outgoingInvitation.status === "accepted" &&
      !showVideoCall
    ) {
      setShowVideoCall(true);
    }
    // Outgoing no longer valid: hide dialog
    if (!outgoingInvitation && prevOutgoingRef.current && prevOutgoingRef.current.status === "accepted") {
      setShowVideoCall(false);
    }
    prevOutgoingRef.current = outgoingInvitation;
  }, [outgoingInvitation, showVideoCall]);

  useEffect(() => {
    // If we have an incoming invitation accepted, show dialog and clear dialog only when incoming/outgoing closes
    if (invitation && invitation.status === "accepted" && !showVideoCall) {
      setShowVideoCall(true);
    }
    if (!invitation && prevInvitationRef.current && prevInvitationRef.current.status === "accepted") {
      setShowVideoCall(false);
    }
  }, [invitation, showVideoCall]);

  const handleCloseCallDialog = (open: boolean) => {
    setShowVideoCall(open);
    if (!open) {
      clear();
    }
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
      setShowVideoCall(true);
    } else if (!accept) {
      toast.info("Video call invitation rejected");
      clear();
      setShowVideoCall(false);
    }
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    toast.info("Call cancelled");
    clear();
    setShowVideoCall(false);
  };

  const inviteDialogOpen = !!invitation && invitation.status === "pending";

  return {
    showVideoCall,
    setShowVideoCall,
    inviteLoading,
    invitation,
    outgoingInvitation,
    recipient,
    conversation,
    roomId,
    inviteDialogOpen,
    handleCloseCallDialog,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing
  };
}
