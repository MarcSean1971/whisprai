
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
    if (!rtcPeerConnection) {
      console.error("[WebRTC] No RTCPeerConnection provided");
      return;
    }
    
    setIsIceGathering(true);
    let iceRestartAttempted = false;
    
    // Enhanced ICE candidate logging
    rtcPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      try {
        if (event.candidate) {
          console.log("[WebRTC] ICE Candidate:", {
            type: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            candidate: event.candidate.candidate.substring(0, 50) + '...'
          });
        } else {
          console.log("[WebRTC] ICE candidate gathering complete");
          setIsIceGathering(false);
        }
      } catch (err) {
        console.error("[WebRTC] Error in ICE candidate handler:", err);
      }
    };
    
    // Improved ICE connection state handling
    rtcPeerConnection.oniceconnectionstatechange = () => {
      try {
        const state = rtcPeerConnection.iceConnectionState;
        console.log("[WebRTC] ICE connection state:", state);
        
        connectionStatsRef.current.iceConnectionState = state;
        connectionStatsRef.current.lastActivity = Date.now();
        
        switch (state) {
          case 'checking':
            console.log("[WebRTC] Checking ICE connection...");
            break;
          case 'connected':
            console.log("[WebRTC] ICE connection established");
            break;
          case 'completed':
            console.log("[WebRTC] ICE connection completed");
            break;
          case 'failed':
            console.warn("[WebRTC] ICE connection failed. Attempting restart...");
            if (!iceRestartAttempted) {
              iceRestartAttempted = true;
              toast.error("Connection interrupted. Reconnecting...");
              // Trigger ICE restart mechanism
              try {
                rtcPeerConnection.restartIce();
              } catch (err) {
                console.error("[WebRTC] Error restarting ICE:", err);
              }
            } else {
              toast.error("Connection failed. Please try again.");
            }
            break;
          case 'disconnected':
            console.warn("[WebRTC] ICE connection disconnected");
            toast.warning("Connection lost. Attempting to reconnect...");
            break;
          case 'closed':
            console.log("[WebRTC] ICE connection closed");
            break;
        }
      } catch (err) {
        console.error("[WebRTC] Error in ICE connection state handler:", err);
      }
    };
    
    // Ice gathering state monitoring
    rtcPeerConnection.onicegatheringstatechange = () => {
      try {
        const state = rtcPeerConnection.iceGatheringState;
        console.log("[WebRTC] ICE gathering state:", state);
        
        connectionStatsRef.current.iceGatheringState = state;
        connectionStatsRef.current.lastActivity = Date.now();
        
        if (state === 'complete') {
          setIsIceGathering(false);
          
          // If we have no ICE candidates after gathering is complete, that's a problem
          if (connectionStatsRef.current.iceCandidates === 0) {
            console.warn("[WebRTC] No ICE candidates were gathered. Network may be restricted.");
            toast.error("Network connection issue. No connection paths found.");
          }
        } else {
          setIsIceGathering(true);
        }
      } catch (err) {
        console.error("[WebRTC] Error in ICE gathering state handler:", err);
      }
    };
    
    // Connection quality monitoring
    rtcPeerConnection.onconnectionstatechange = async () => {
      try {
        const connectionState = rtcPeerConnection.connectionState;
        console.log("[WebRTC] Peer Connection State:", connectionState);
        
        connectionStatsRef.current.connectionState = connectionState;
        connectionStatsRef.current.lastActivity = Date.now();
        
        if (connectionState === 'failed') {
          try {
            const stats = await rtcPeerConnection.getStats();
            let candidatePairFailures = 0;
            
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'failed') {
                candidatePairFailures++;
                console.warn("[WebRTC] Candidate pair failed:", report);
              }
            });
            
            console.log("[WebRTC] Failed candidate pairs:", candidatePairFailures);
            
            if (candidatePairFailures > 0) {
              toast.error("Connection failed. Network configuration may be blocking the connection.");
            }
          } catch (error) {
            console.error("[WebRTC] Error getting connection stats:", error);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Error in connection state handler:", err);
      }
    };
    
    // Signaling state
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
      // Cleanup
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
  }, [setIsIceGathering, connectionStatsRef, toast]);

  return { setupRTCConnection };
}
