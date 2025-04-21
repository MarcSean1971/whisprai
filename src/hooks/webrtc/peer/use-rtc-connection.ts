
import { useCallback } from "react";

interface UseRTCConnectionProps {
  setIsIceGathering: (value: boolean) => void;
  connectionStatsRef: React.MutableRefObject<any>;
  toast: any;
}

export function useRTCConnection({
  setIsIceGathering,
  connectionStatsRef,
  toast
}: UseRTCConnectionProps) {
  const setupRTCConnection = useCallback((rtcPeerConnection: RTCPeerConnection) => {
    setIsIceGathering(true);
    
    rtcPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("[WebRTC] New ICE candidate:", event.candidate.candidate);
      } else {
        console.log("[WebRTC] All ICE candidates gathered");
        setIsIceGathering(false);
      }
    };
    
    rtcPeerConnection.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", rtcPeerConnection.iceConnectionState);
      connectionStatsRef.current.iceConnectionState = rtcPeerConnection.iceConnectionState;
      connectionStatsRef.current.lastActivity = Date.now();
      
      if (rtcPeerConnection.iceConnectionState === 'failed') {
        console.warn("[WebRTC] ICE connection failed, possibly blocked by firewall/NAT");
        toast.error("Connection failed. Network restrictions may be blocking the call.");
      }
    };
    
    rtcPeerConnection.onicegatheringstatechange = () => {
      console.log("[WebRTC] ICE gathering state:", rtcPeerConnection.iceGatheringState);
      connectionStatsRef.current.iceGatheringState = rtcPeerConnection.iceGatheringState;
      connectionStatsRef.current.lastActivity = Date.now();
      
      if (rtcPeerConnection.iceGatheringState === 'complete') {
        setIsIceGathering(false);
      }
    };
    
    rtcPeerConnection.onsignalingstatechange = () => {
      console.log("[WebRTC] Signaling state:", rtcPeerConnection.signalingState);
      connectionStatsRef.current.signalingState = rtcPeerConnection.signalingState;
      connectionStatsRef.current.lastActivity = Date.now();
    };
    
    rtcPeerConnection.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", rtcPeerConnection.connectionState);
      connectionStatsRef.current.connectionState = rtcPeerConnection.connectionState;
      connectionStatsRef.current.lastActivity = Date.now();
    };
  }, [setIsIceGathering, connectionStatsRef, toast]);

  return { setupRTCConnection };
}
