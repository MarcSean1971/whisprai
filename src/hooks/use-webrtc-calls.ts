
import { useCallback, useEffect, useState } from "react";
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
    resetCallState
  } = useCallSession(conversationId, currentUserId);

  const [shouldInitiatePeer, setShouldInitiatePeer] = useState(false);

  const {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    updateSignalingData,
  } = useCallActions(conversationId, currentUserId, otherUserId, incomingCall, async () => {
    // This is passed as fetchCallHistory callback to useCallActions
  });

  // Handle call session status changes
  useEffect(() => {
    if (callSession) {
      console.log("[WebRTCCalls] Call session status changed:", callSession.status);
      
      if (callSession.status === "connected") {
        // Signal that peer connection should be initialized/reinforced
        setShouldInitiatePeer(true);
      } else if (["ended", "rejected", "missed"].includes(callSession.status)) {
        // Reset state after a delay to allow animations to complete
        setTimeout(() => {
          resetCallState();
        }, 2000);
      }
    }
  }, [callSession, resetCallState]);

  // Auto-reject incoming call if already in another call
  useEffect(() => {
    if (
      incomingCall && 
      callSession && 
      callSession.status === "connected" &&
      incomingCall.id !== callSession.id
    ) {
      console.log("[WebRTCCalls] Auto-rejecting incoming call while in another call");
      rejectCall();
    }
  }, [incomingCall, callSession, rejectCall]);

  // Wrapped accept call to ensure database and UI state are synchronized
  const handleAcceptCall = useCallback(async () => {
    console.log("[WebRTCCalls] Accepting call");
    
    if (!incomingCall) {
      console.error("[WebRTCCalls] No incoming call to accept");
      return;
    }
    
    try {
      await acceptCall();
      setShouldInitiatePeer(true);
    } catch (error) {
      console.error("[WebRTCCalls] Error accepting call:", error);
    }
  }, [acceptCall, incomingCall]);

  // Wrapped reject call to ensure proper cleanup
  const handleRejectCall = useCallback(async () => {
    console.log("[WebRTCCalls] Rejecting call");
    
    try {
      await rejectCall();
      resetCallState();
    } catch (error) {
      console.error("[WebRTCCalls] Error rejecting call:", error);
    }
  }, [rejectCall, resetCallState]);

  // Wrapped end call to ensure proper cleanup
  const handleEndCall = useCallback(async (sessionId?: string) => {
    console.log("[WebRTCCalls] Ending call");
    
    try {
      await endCall(sessionId);
      resetCallState();
    } catch (error) {
      console.error("[WebRTCCalls] Error ending call:", error);
    }
  }, [endCall, resetCallState]);

  return {
    isCalling,
    callSession,
    incomingCall,
    startCall,
    acceptCall: handleAcceptCall,
    rejectCall: handleRejectCall,
    status,
    updateSignalingData,
    signaling,
    setSignaling,
    remoteSignal,
    callHistory,
    endCall: handleEndCall,
    shouldInitiatePeer
  };
}
