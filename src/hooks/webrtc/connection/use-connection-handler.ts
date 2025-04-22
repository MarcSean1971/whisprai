
import { useCallback } from "react";
import { toast } from "sonner";

interface UseConnectionHandlerProps {
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useConnectionHandler({
  connectionStatsRef
}: UseConnectionHandlerProps) {
  const handleConnectionState = useCallback(async (
    connectionState: RTCPeerConnectionState,
    rtcPeerConnection: RTCPeerConnection
  ) => {
    try {
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
  }, [connectionStatsRef]);

  return { handleConnectionState };
}
