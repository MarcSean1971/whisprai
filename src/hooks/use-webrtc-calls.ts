import { useCallback, useEffect } from "react";
import { useCallSession } from "./webrtc/use-call-session";
import { useCallActions } from "./webrtc/use-call-actions";
import { CallSession } from "./webrtc/types";

export function useWebRTCCalls(
  conversationId: string,
  currentUserId: string,
  otherUserId: string
) {
  const {
    isCalling,
    callSession,
    incomingCall,
    status,
    signaling,
    setSignaling,
    remoteSignal,
    callHistory,
  } = useCallSession(conversationId, currentUserId);

  const {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    updateSignalingData,
  } = useCallActions(conversationId, currentUserId, otherUserId, incomingCall, async () => {
    // This is passed as fetchCallHistory callback to useCallActions
  });

  // Auto-clear ended call session
  useEffect(() => {
    if (
      callSession &&
      ["ended", "rejected", "missed"].includes(callSession.status)
    ) {
      // Reset state handled by useCallSession
    }
  }, [callSession]);

  return {
    isCalling,
    callSession,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    status,
    updateSignalingData,
    signaling,
    setSignaling,
    remoteSignal,
    callHistory,
    endCall,
  };
}
