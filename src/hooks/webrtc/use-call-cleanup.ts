
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
    console.log("[WebRTC] Ending call immediately");
    
    // Clear duration timer first
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    // Destroy peer connection immediately
    destroyPeer();
    
    // Stop all tracks in the local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        localStream.removeTrack(track);
      });
    }
    
    // Clean up screen sharing
    cleanupScreenShare();
    
    // Reset all streams and states synchronously
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus("ended");
    setCallDuration(0);
  }, [
    localStream, 
    cleanupScreenShare, 
    durationTimerRef, 
    setLocalStream,
    setCallDuration,
    destroyPeer,
    setRemoteStream,
    setConnectionStatus
  ]);

  return { endCall };
}
