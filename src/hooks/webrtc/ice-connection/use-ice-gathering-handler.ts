
import { useCallback } from "react";
import { toast } from "sonner";

interface UseIceGatheringHandlerProps {
  setIsIceGathering: (value: boolean) => void;
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useIceGatheringHandler({
  setIsIceGathering,
  connectionStatsRef
}: UseIceGatheringHandlerProps) {
  const handleIceGatheringState = useCallback((state: RTCIceGatheringState) => {
    try {
      console.log("[WebRTC] ICE gathering state:", state);
      
      connectionStatsRef.current.iceGatheringState = state;
      connectionStatsRef.current.lastActivity = Date.now();
      
      if (state === 'complete') {
        setIsIceGathering(false);
        
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
  }, [setIsIceGathering, connectionStatsRef]);

  return { handleIceGatheringState };
}
