
import { useCallback } from "react";
import { toast } from "sonner";

interface UseIceConnectionHandlerProps {
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useIceConnectionHandler({
  connectionStatsRef
}: UseIceConnectionHandlerProps) {
  const handleIceConnectionState = useCallback((state: RTCIceConnectionState) => {
    try {
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
          console.warn("[WebRTC] ICE connection failed");
          toast.error("Connection failed. Please try again.");
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
  }, [connectionStatsRef]);

  return { handleIceConnectionState };
}
