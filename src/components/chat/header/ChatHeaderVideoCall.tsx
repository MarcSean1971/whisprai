
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { VideoCallDialog } from "./VideoCallDialog";
import React from "react";
import { useVideoCallHandler } from "./useVideoCallHandler";
import { VideoCallInviteDialog } from "./VideoCallInviteDialog";
import { VideoCallOutgoingDialog } from "./VideoCallOutgoingDialog";

interface Props {
  conversationId: string;
}

/**
 * Display minimal banners for "calling" and "incoming call".
 * Instantly open the video dialog when accepted.
 */
export function ChatHeaderVideoCall({ conversationId }: Props) {
  const {
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
  } = useVideoCallHandler(conversationId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={handleStartCall}
        title="Start Video Call"
        disabled={inviteLoading || outgoingPending || incomingPending || videoDialogOpen}
      >
        <Video className="h-5 w-5" />
      </Button>
      {/* Outgoing "calling..." banner */}
      {outgoingPending && outgoingInvitation && (
        <VideoCallOutgoingDialog
          open
          loading={inviteLoading}
          onCancel={handleCancelOutgoing}
          recipientName={
            conversation?.participants?.find(p => p.id === outgoingInvitation?.recipient_id)?.first_name ||
            "Recipient"
          }
        />
      )}
      {/* Incoming call banner */}
      {incomingPending && invitation && (
        <VideoCallInviteDialog
          open
          onRespond={handleRespondInvite}
          loading={inviteLoading}
          inviterName={
            conversation?.participants?.find(p => p.id === invitation?.sender_id)?.first_name ||
            "Someone"
          }
        />
      )}
      {/* Show video call dialog window if accepted */}
      {videoDialogOpen && (
        <VideoCallDialog
          open={videoDialogOpen}
          onOpenChange={handleCloseCallDialog}
          roomId={videoDialogRoomId}
        />
      )}
    </>
  );
}
