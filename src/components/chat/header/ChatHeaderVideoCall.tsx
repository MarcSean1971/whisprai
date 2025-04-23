
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { VideoCallDialog } from "./VideoCallDialog";
import { VideoCallInviteDialog } from "./VideoCallInviteDialog";
import { VideoCallOutgoingDialog } from "./VideoCallOutgoingDialog";
import React from "react";
import { useVideoCallHandler } from "./useVideoCallHandler";

interface Props {
  conversationId: string;
}

export function ChatHeaderVideoCall({ conversationId }: Props) {
  const {
    videoDialogOpen,
    inviteLoading,
    invitation,
    outgoingInvitation,
    inviteDialogOpen,
    outgoingDialogOpen,
    recipient,
    conversation,
    roomId,
    handleCloseCallDialog,
    handleStartCall,
    handleRespondInvite,
    handleCancelOutgoing,
  } = useVideoCallHandler(conversationId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={handleStartCall}
        title="Start Video Call"
        disabled={inviteLoading || !!outgoingInvitation}
      >
        <Video className="h-5 w-5" />
      </Button>
      {/* Only ONE dialog shows at any time */}
      {outgoingDialogOpen && (
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
      {inviteDialogOpen && (
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
      {videoDialogOpen && (
        <VideoCallDialog
          open={videoDialogOpen}
          onOpenChange={handleCloseCallDialog}
          roomId={
            (invitation?.status === "accepted" ? invitation.room_id :
              outgoingInvitation?.status === "accepted" ? outgoingInvitation.room_id :
                roomId)
          }
        />
      )}
    </>
  );
}
