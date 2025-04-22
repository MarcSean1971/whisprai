
import { useCallInitiator } from "./call-actions/use-call-initiator";
import { useCallResponse } from "./call-actions/use-call-response";
import { useCallTerminator } from "./call-actions/use-call-terminator";
import { useSignaling } from "./call-actions/use-signaling";
import { CallSession, UseCallActionsReturn } from "./types";

export function useCallActions(
  conversationId: string,
  currentUserId: string,
  otherUserId: string,
  incomingCall: CallSession | null,
  fetchCallHistory: () => Promise<void>
): UseCallActionsReturn {
  const { endCall } = useCallTerminator(fetchCallHistory);
  const { startCall } = useCallInitiator(conversationId, currentUserId, otherUserId, endCall);
  const { acceptCall, rejectCall } = useCallResponse({ incomingCall, fetchCallHistory });
  const { updateSignalingData } = useSignaling();

  return {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    updateSignalingData,
  };
}
