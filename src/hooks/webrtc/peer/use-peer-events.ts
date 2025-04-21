
import { useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { ConnectionStatus } from "../types";

interface UsePeerEventsProps {
  onSignal: (data: any) => void;
  onConnect: () => void;
  onStream: (stream: MediaStream) => void;
  onClose: () => void;
  onError: (error: Error) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  connectionStatsRef: React.MutableRefObject<any>;
  setIceCandidate: (cb: (prev: number) => number) => void;
  clearConnectionTimeout: () => void;
}

export function usePeerEvents({
  onSignal,
  onConnect,
  onStream,
  onClose,
  onError,
  setConnectionStatus,
  connectionStatsRef,
  setIceCandidate,
  clearConnectionTimeout,
}: UsePeerEventsProps) {
  const setupPeerEvents = useCallback((peer: Peer.Instance) => {
    peer.on("signal", data => {
      console.log("[WebRTC] Generated signal:", data.type || "ICE candidate");
      onSignal(data);
      
      if (data.type === 'candidate') {
        connectionStatsRef.current.iceCandidates++;
        connectionStatsRef.current.lastActivity = Date.now();
        setIceCandidate(prev => prev + 1);
      }
    });

    peer.on("connect", () => {
      console.log("[WebRTC] Peer connection established!");
      setConnectionStatus("connected");
      onConnect();
      clearConnectionTimeout();
      toast.success("Call connected");
    });

    peer.on("stream", remote => {
      console.log("[WebRTC] Received remote stream");
      onStream(remote);
    });

    peer.on("error", err => {
      console.error("[WebRTC] Peer connection error:", err);
      toast.error(`Connection error: ${err.message}`);
      setConnectionStatus("error");
      onError(err);
    });

    peer.on("close", () => {
      console.log("[WebRTC] Peer connection closed");
      setConnectionStatus("ended");
      onClose();
    });
  }, [onSignal, onConnect, onStream, onClose, onError, setConnectionStatus, connectionStatsRef, setIceCandidate, clearConnectionTimeout]);

  return { setupPeerEvents };
}
