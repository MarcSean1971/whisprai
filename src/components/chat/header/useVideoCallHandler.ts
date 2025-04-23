
import { useMemo, useState } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { toast } from "sonner";

export function useVideoCallHandler(conversationId: string) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find((p) => p.id !== profile.id) || null;
  }, [conversation, profile]);

  // Generate a stable room ID based on conversation and participant IDs
  const roomId = useMemo(() => {
    if (!conversation?.id || !profile?.id || !recipient?.id) {
      console.error('Missing required IDs for room generation:', {
        conversationId: conversation?.id,
        profileId: profile?.id,
        recipientId: recipient?.id
      });
      return null;
    }

    // Create a deterministic room ID that will be the same for both participants
    const participantIds = [profile.id, recipient.id].sort();
    const roomIdBase = `${conversation.id}_${participantIds[0]}_${participantIds[1]}`;
    console.log('Generated room ID:', roomIdBase);
    return roomIdBase;
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
    if (!recipient?.id || !roomId) {
      console.error('Cannot start call: missing recipient ID or room ID');
      toast.error('Unable to start call', {
        description: 'Missing required information'
      });
      return;
    }

    try {
      console.log('Starting call with room ID:', roomId);
      await sendInvitation(recipient.id, roomId);
    } catch (error) {
      console.error("Failed to start call:", error);
      toast.error('Failed to start call', {
        description: 'Please try again later'
      });
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) {
      console.error('No active invitation to respond to');
      return;
    }

    try {
      console.log(`${accept ? 'Accepting' : 'Rejecting'} call with room ID:`, invitation.room_id);
      await respondInvitation(invitation.id, accept);
    } catch (error) {
      console.error("Failed to respond to call:", error);
      toast.error('Failed to respond to call', {
        description: 'Please try again later'
      });
      clear();
    }
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) {
      console.error('No active outgoing invitation to cancel');
      return;
    }

    try {
      console.log('Cancelling outgoing call with room ID:', outgoingInvitation.room_id);
      await cancelOutgoing(outgoingInvitation.id);
    } catch (error) {
      console.error("Failed to cancel call:", error);
      toast.error('Failed to cancel call', {
        description: 'Please try again later'
      });
    }
    clear();
  };

  const handleCloseVideoCall = async () => {
    const activeInvitation = invitation || outgoingInvitation;
    if (!activeInvitation) {
      console.error('No active invitation to end');
      return;
    }

    try {
      console.log('Ending call with room ID:', activeInvitation.room_id);
      await endCall(activeInvitation.id);
    } catch (error) {
      console.error("Failed to end call:", error);
      toast.error('Failed to end call', {
        description: 'The call window will still be closed'
      });
    }
    clear();
  };

  const activeRoomId = useMemo(() => {
    if (showVideoCall) {
      const roomId = invitation?.room_id || outgoingInvitation?.room_id;
      console.log('Using active room ID:', roomId);
      return roomId;
    }
    console.log('Using generated room ID:', roomId);
    return roomId;
  }, [showVideoCall, invitation, outgoingInvitation, roomId]);

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
    roomId: activeRoomId,
  };
}
