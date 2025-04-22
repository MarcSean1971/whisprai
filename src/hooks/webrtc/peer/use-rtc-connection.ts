
import { useCallback } from "react";
import { useIceCandidateHandler } from "../ice-connection/use-ice-candidate-handler";
import { useIceConnectionHandler } from "../ice-connection/use-ice-connection-handler";
import { useIceGatheringHandler } from "../ice-connection/use-ice-gathering-handler";
import { useConnectionHandler } from "../connection/use-connection-handler";

interface UseRTCConnectionProps {
  setIsIceGathering: (value: boolean) => void;
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useRTCConnection({
  setIsIceGathering,
  connectionStatsRef,
}: UseRTCConnectionProps) {
  const { handleIceCandidate } = useIceCandidateHandler({
    setIsIceGathering,
    connectionStatsRef
  });

  const { handleIceConnectionState } = useIceConnectionHandler({
    connectionStatsRef
  });

  const { handleIceGatheringState } = useIceGatheringHandler({
    setIsIceGathering,
    connectionStatsRef
  });

  const { handleConnectionState } = useConnectionHandler({
    connectionStatsRef
  });

  const setupRTCConnection = useCallback((rtcPeerConnection: RTCPeerConnection) => {
    if (!rtcPeerConnection) {
      console.error("[WebRTC] No RTCPeerConnection provided");
      return;
    }
    
    setIsIceGathering(true);
    
    // Set up event handlers
    rtcPeerConnection.onicecandidate = handleIceCandidate;
    rtcPeerConnection.oniceconnectionstatechange = () => {
      handleIceConnectionState(rtcPeerConnection.iceConnectionState);
    };
    rtcPeerConnection.onicegatheringstatechange = () => {
      handleIceGatheringState(rtcPeerConnection.iceGatheringState);
    };
    rtcPeerConnection.onconnectionstatechange = () => {
      handleConnectionState(rtcPeerConnection.connectionState, rtcPeerConnection);
    };
    rtcPeerConnection.onsignalingstatechange = () => {
      try {
        const state = rtcPeerConnection.signalingState;
        console.log("[WebRTC] Signaling state:", state);
        
        connectionStatsRef.current.signalingState = state;
        connectionStatsRef.current.lastActivity = Date.now();
      } catch (err) {
        console.error("[WebRTC] Error in signaling state handler:", err);
      }
    };
    
    return () => {
      try {
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.oniceconnectionstatechange = null;
        rtcPeerConnection.onicegatheringstatechange = null;
        rtcPeerConnection.onconnectionstatechange = null;
        rtcPeerConnection.onsignalingstatechange = null;
      } catch (err) {
        console.error("[WebRTC] Error in RTC connection cleanup:", err);
      }
    };
  }, [
    setIsIceGathering,
    handleIceCandidate,
    handleIceConnectionState,
    handleIceGatheringState,
    handleConnectionState,
    connectionStatsRef
  ]);

  return { setupRTCConnection };
}
