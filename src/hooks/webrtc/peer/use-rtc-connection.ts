
import { useCallback } from "react";
import { toast } from "sonner";

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
    
    // Enhanced ICE candidate logging
    rtcPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("[WebRTC] ICE Candidate:", {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address
        });
      } else {
        console.log("[WebRTC] ICE candidate gathering complete");
        setIsIceGathering(false);
      }
    };
    
    // Improved ICE connection state handling
    rtcPeerConnection.oniceconnectionstatechange = () => {
      const state = rtcPeerConnection.iceConnectionState;
      console.log("[WebRTC] ICE connection state:", state);
      
      connectionStatsRef.current.iceConnectionState = state;
      connectionStatsRef.current.lastActivity = Date.now();
      
      switch (state) {
        case 'failed':
          console.warn("[WebRTC] ICE connection failed. Attempting restart...");
          toast.error("Connection interrupted. Reconnecting...");
          // Trigger ICE restart mechanism
          rtcPeerConnection.restartIce();
          break;
        case 'disconnected':
          toast.warning("Connection lost. Attempting to reconnect...");
          break;
      }
    };
    
    // Connection quality monitoring
    rtcPeerConnection.onconnectionstatechange = async () => {
      const connectionState = rtcPeerConnection.connectionState;
      console.log("[WebRTC] Peer Connection State:", connectionState);
      
      connectionStatsRef.current.connectionState = connectionState;
      connectionStatsRef.current.lastActivity = Date.now();
      
      if (connectionState === 'failed') {
        try {
          const stats = await rtcPeerConnection.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'failed') {
              console.warn("[WebRTC] Candidate pair failed:", report);
            }
          });
        } catch (error) {
          console.error("[WebRTC] Error getting connection stats:", error);
        }
      }
    };
    
    return () => {
      // Optional cleanup
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.oniceconnectionstatechange = null;
      rtcPeerConnection.onconnectionstatechange = null;
    };
  }, [setIsIceGathering, connectionStatsRef, toast]);

  return { setupRTCConnection };
}
