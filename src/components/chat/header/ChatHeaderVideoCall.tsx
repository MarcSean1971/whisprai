
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallHandler } from "./useVideoCallHandler";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { DialingDialog } from "./DialingDialog";
import { VideoCallDialog } from "./VideoCallDialog";

/**
 * Button for starting video calls and rendering the dialing dialog.
 */
interface Props {
  conversationId: string;
}

export function ChatHeaderVideoCall({ conversationId }: Props) {
  const { profile } = useProfile();
  const {
    recipient,
    invitation,
    outgoingInvitation,
    handleStartCall,
    handleCancelOutgoing,
    handleRespondInvite,
    handleCloseVideoCall,
    inviteLoading,
    outgoingPending,
    incomingPending,
    conversation,
    showVideoCall,
    roomId,
  } = useVideoCallHandler(conversationId);

  // Name for receiver (show to caller)
  const receiverName =
    recipient?.first_name && recipient?.last_name
      ? `${recipient.first_name} ${recipient.last_name}`
      : recipient?.first_name || "Recipient";
  // Name for caller (show to receiver)
  const senderProfile =
    conversation?.participants?.find(
      (p) => p.id === (outgoingInvitation?.sender_id || invitation?.sender_id)
    );
  const callerName =
    senderProfile && senderProfile.first_name
      ? `${senderProfile.first_name} ${senderProfile.last_name ?? ""}`.trim()
      : "Caller";

  // Show dialog for both outgoing or incoming.
  const showOutgoing = !!outgoingInvitation && outgoingInvitation.status === "pending";
  const showIncoming = !!invitation && invitation.status === "pending";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        title="Start Video Call"
        onClick={handleStartCall}
        disabled={inviteLoading || outgoingPending || incomingPending}
      >
        <Video className="h-5 w-5" />
      </Button>
      
      {/* Outgoing (Caller) */}
      {showOutgoing && (
        <DialingDialog
          open={true}
          type="outgoing"
          name={receiverName}
          loading={inviteLoading}
          onCancel={handleCancelOutgoing}
        />
      )}
      
      {/* Incoming (Receiver) */}
      {showIncoming && (
        <DialingDialog
          open={true}
          type="incoming"
          name={callerName}
          loading={inviteLoading}
          onAccept={() => handleRespondInvite(true)}
          onReject={() => handleRespondInvite(false)}
        />
      )}

      {/* Active Video Call */}
      {showVideoCall && (
        <VideoCallDialog
          open={true}
          onOpenChange={handleCloseVideoCall}
          roomId={roomId}
          userName={profile?.first_name || "User"}
          recipientName={receiverName}
        />
      )}
    </>
  );
}
