
import { useMemo, useState } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { toast } from "@/components/ui/use-toast";

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
    endCall
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  const outgoingPending = !!outgoingInvitation && outgoingInvitation.status === "pending";
  const incomingPending = !!invitation && invitation.status === "pending";
  
  // Show video call when either invitation is accepted
  const showVideoCall = (invitation?.status === "accepted" && invitation.room_id) || 
                       (outgoingInvitation?.status === "accepted" && outgoingInvitation.room_id);

  const handleStartCall = async () => {
    if (!recipient?.id) return;
    try {
      await sendInvitation(recipient.id, roomId);
    } catch (error) {
      console.error("Failed to start call:", error);
      toast({
        variant: "destructive",
        title: "Failed to start call",
        description: "Please try again later"
      });
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    try {
      await respondInvitation(invitation.id, accept);
    } catch (error) {
      console.error("Failed to respond to call:", error);
      toast({
        variant: "destructive",
        title: "Failed to respond to call",
        description: "Please try again later"
      });
      clear();
    }
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    try {
      await cancelOutgoing(outgoingInvitation.id);
    } catch (error) {
      console.error("Failed to cancel call:", error);
      toast({
        variant: "destructive",
        title: "Failed to cancel call",
        description: "Please try again later"
      });
    }
    clear();
  };

  const handleCloseVideoCall = async () => {
    try {
      if (invitation) {
        await endCall(invitation.id);
      } else if (outgoingInvitation) {
        await endCall(outgoingInvitation.id);
      }
    } catch (error) {
      console.error("Failed to end call:", error);
      toast({
        variant: "destructive",
        title: "Failed to end call",
        description: "The call window will still be closed"
      });
    }
    clear();
  };

  return {
    recipient,
    invitation,
    outgoingInvitation,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing,
    handleCloseVideoCall,
    inviteLoading,
    outgoingPending,
    incomingPending,
    conversation,
    showVideoCall,
    roomId: showVideoCall ? (invitation?.room_id || outgoingInvitation?.room_id) : roomId,
  };
}
