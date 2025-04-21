
import { useCallback } from "react";
import { ConnectionStatus } from "./types";

interface UseCallCleanupProps {
  localStream: MediaStream | null;
  cleanupScreenShare: () => void;
  destroyPeer: () => void;
  durationTimerRef: React.MutableRefObject<number | null>;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCallDuration: (duration: number) => void;
}

export function useCallCleanup({
  localStream,
  cleanupScreenShare,
  destroyPeer,
  durationTimerRef,
  setLocalStream,
  setRemoteStream,
  setConnectionStatus,
  setCallDuration
}: UseCallCleanupProps) {
  const endCall = useCallback(() => {
    console.log("[WebRTC] Ending call");
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    destroyPeer();
    
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    
    cleanupScreenShare();
    
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus("ended");
    setCallDuration(0);
  }, [localStream, cleanupScreenShare, durationTimerRef, setLocalStream, setCallDuration, destroyPeer, setRemoteStream, setConnectionStatus]);

  return { endCall };
}
