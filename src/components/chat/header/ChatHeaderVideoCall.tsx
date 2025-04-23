
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallHandler } from "./useVideoCallHandler";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState } from "react";
import { CallStatusDialog } from "./CallStatusDialog";

/**
 * Button for starting video calls and rendering the call dialog.
 */
interface Props {
  conversationId: string;
}

export function ChatHeaderVideoCall({ conversationId }: Props) {
  const { profile } = useProfile();
  const [showDialog, setShowDialog] = useState(false);

  // Use custom hook to manage invitations and status
  const {
    recipient,
    invitation,
    outgoingInvitation,
    handleStartCall,
    handleCancelOutgoing,
    handleRespondInvite,
    inviteLoading,
    incomingPending,
    outgoingPending,
    conversation,
  } = useVideoCallHandler(conversationId);

  // If user is invited, show dialog (incoming)
  const incoming = invitation && invitation.status === "pending";
  // If user is calling, show "dialing" dialog (outgoing)
  const outgoing = outgoingInvitation && outgoingInvitation.status === "pending";

  // Determine display name for recipient/sender
  const recipientName =
    recipient?.first_name && recipient?.last_name
      ? `${recipient.first_name} ${recipient.last_name}`
      : recipient?.first_name || "Recipient";
  const senderProfile =
    conversation?.participants?.find((p) => p.id === outgoingInvitation?.sender_id || invitation?.sender_id);
  const senderName =
    senderProfile && senderProfile.first_name
      ? `${senderProfile.first_name} ${senderProfile.last_name ?? ""}`.trim()
      : "Someone";

  // Control dialog visibility
  const dialogOpen = incoming || outgoing;

  // UI: Only show dialog if there's a pending call (incoming/outgoing)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        title="Start Video Call"
        onClick={handleStartCall}
        disabled={inviteLoading || !!outgoingPending || !!incomingPending}
      >
        <Video className="h-5 w-5" />
      </Button>
      {dialogOpen && outgoing && (
        <CallStatusDialog
          open={true}
          type="dialing"
          name={recipientName}
          onCancel={handleCancelOutgoing}
          loading={inviteLoading}
        />
      )}
      {dialogOpen && incoming && (
        <CallStatusDialog
          open={true}
          type="incoming"
          name={senderName}
          onAccept={() => handleRespondInvite(true)}
          onReject={() => handleRespondInvite(false)}
          loading={inviteLoading}
        />
      )}
    </>
  );
}
