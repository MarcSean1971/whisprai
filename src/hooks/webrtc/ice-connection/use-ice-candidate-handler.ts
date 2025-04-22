
import { useCallback } from "react";

interface UseIceCandidateHandlerProps {
  setIsIceGathering: (value: boolean) => void;
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useIceCandidateHandler({
  setIsIceGathering,
  connectionStatsRef
}: UseIceCandidateHandlerProps) {
  const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
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
  }, [setIsIceGathering]);

  return { handleIceCandidate };
}
