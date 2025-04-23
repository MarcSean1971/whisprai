
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallHandler } from "./useVideoCallHandler";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState } from "react";

/**
 * Button for starting video calls.
 * All dialogs (incoming/outgoing/dialing) have been removed as per request.
 */
interface Props {
  conversationId: string;
}

export function ChatHeaderVideoCall({ conversationId }: Props) {
  const { profile } = useProfile();
  const {
    recipient,
    handleStartCall,
    inviteLoading,
    outgoingPending,
    incomingPending,
    // Remove everything else related to invitation UI
  } = useVideoCallHandler(conversationId);

  // Only show a disabled button if already calling or invited
  return (
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
  );
}
