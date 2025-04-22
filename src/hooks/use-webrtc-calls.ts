
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
    resetCallState,
    stopRingtone,
    fetchCallHistory
  } = useCallSession(conversationId, currentUserId);

  const [shouldInitiatePeer, setShouldInitiatePeer] = useState(false);
  const [callCleanupInProgress, setCallCleanupInProgress] = useState(false);

  const {
    startCall,
    acceptCall: rawAcceptCall,
    rejectCall: rawRejectCall,
    endCall: rawEndCall,
    updateSignalingData,
  } = useCallActions(conversationId, currentUserId, otherUserId, incomingCall, fetchCallHistory, stopRingtone);

  // Handle call session status changes
  useEffect(() => {
    if (callSession) {
      console.log("[WebRTCCalls] Call session status changed:", callSession.status);
      
      if (callSession.status === "connected") {
        // Signal that peer connection should be initialized/reinforced
        console.log("[WebRTCCalls] Setting shouldInitiatePeer to true");
        setShouldInitiatePeer(true);
      } else if (["ended", "rejected", "missed"].includes(callSession.status)) {
        // Reset state after a delay to allow animations to complete
        if (!callCleanupInProgress) {
          setCallCleanupInProgress(true);
          
          console.log("[WebRTCCalls] Call ended, cleaning up in 3 seconds");
          setTimeout(() => {
            console.log("[WebRTCCalls] Executing delayed cleanup");
            resetCallState();
            setShouldInitiatePeer(false);
            setCallCleanupInProgress(false);
          }, 3000);
        }
      }
    }
  }, [callSession, resetCallState, callCleanupInProgress]);

  // Auto-reject incoming call if already in another call
  useEffect(() => {
    if (
      incomingCall && 
      callSession && 
      callSession.status === "connected" &&
      incomingCall.id !== callSession.id
    ) {
      console.log("[WebRTCCalls] Auto-rejecting incoming call while in another call");
      rawRejectCall();
    }
  }, [incomingCall, callSession, rawRejectCall]);

  // Wrapped accept call to ensure database and UI state are synchronized
  const handleAcceptCall = useCallback(async () => {
    console.log("[WebRTCCalls] Accepting call with enhanced coordination");
    
    if (!incomingCall) {
      console.error("[WebRTCCalls] No incoming call to accept");
      return;
    }
    
    try {
      await rawAcceptCall();
      
      // Explicitly set this flag to ensure peer connection gets initialized
      console.log("[WebRTCCalls] Setting shouldInitiatePeer to true after accepting call");
      setShouldInitiatePeer(true);
    } catch (error) {
      console.error("[WebRTCCalls] Error accepting call:", error);
      
      // On error, make sure we reset everything
      resetCallState();
    }
  }, [rawAcceptCall, incomingCall, resetCallState]);

  // Wrapped reject call to ensure proper cleanup
  const handleRejectCall = useCallback(async () => {
    console.log("[WebRTCCalls] Rejecting call with enhanced cleanup");
    
    if (!incomingCall) {
      console.error("[WebRTCCalls] No incoming call to reject");
      return;
    }
    
    try {
      await rawRejectCall();
      setShouldInitiatePeer(false);
      
      // Allow time for UI animations before resetting state
      setTimeout(() => {
        console.log("[WebRTCCalls] Executing delayed cleanup after reject");
        resetCallState();
      }, 3000);
    } catch (error) {
      console.error("[WebRTCCalls] Error rejecting call:", error);
      
      // Even on error, make sure we clean up
      resetCallState();
    }
  }, [rawRejectCall, resetCallState, incomingCall]);

  // Wrapped end call to ensure proper cleanup
  const handleEndCall = useCallback(async (sessionId?: string) => {
    console.log("[WebRTCCalls] Ending call with enhanced cleanup");
    
    try {
      await rawEndCall(sessionId);
      setShouldInitiatePeer(false);
      
      // Allow time for UI animations before resetting state
      setTimeout(() => {
        console.log("[WebRTCCalls] Executing delayed cleanup after end call");
        resetCallState();
      }, 3000);
    } catch (error) {
      console.error("[WebRTCCalls] Error ending call:", error);
      
      // Even on error, make sure we clean up
      resetCallState();
    }
  }, [rawEndCall, resetCallState]);

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
