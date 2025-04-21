
import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { ConnectionStatus } from "./types";

interface UsePeerConnectionProps {
  initiator: boolean;
  localStream: MediaStream | null;
  onSignal: (data: any) => void;
  remoteSignal?: any;
  onConnect: () => void;
  onStream: (stream: MediaStream) => void;
  onClose: () => void;
  onError: (error: Error) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export function usePeerConnection({
  initiator,
  localStream,
  onSignal,
  remoteSignal,
  onConnect,
  onStream,
  onClose,
  onError,
  setConnectionStatus,
}: UsePeerConnectionProps) {
  const peerRef = useRef<Peer.Instance | null>(null);

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    };
    
    const p = new Peer(peerOptions);
    peerRef.current = p;

    p.on("signal", data => {
      console.log("[WebRTC] Generated signal");
      onSignal(data);
    });

    p.on("connect", () => {
      console.log("[WebRTC] Peer connection established!");
      setConnectionStatus("connected");
      onConnect();
      toast.success("Call connected");
    });

    p.on("stream", remote => {
      console.log("[WebRTC] Received remote stream");
      onStream(remote);
    });

    p.on("error", err => {
      console.error("[WebRTC] Peer connection error:", err);
      toast.error(`Connection error: ${err.message}`);
      setConnectionStatus("error");
      onError(err);
    });

    p.on("close", () => {
      console.log("[WebRTC] Peer connection closed");
      setConnectionStatus("ended");
      onClose();
    });

    if (remoteSignal) {
      try {
        console.log("[WebRTC] Applying remote signal");
        p.signal(remoteSignal);
        setConnectionStatus("connecting");
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }

    return () => {
      try {
        p.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    };
  }, [initiator, localStream, onSignal, onConnect, onStream, onClose, onError, remoteSignal, setConnectionStatus]);

  const signalPeer = useCallback((signal: any) => {
    if (peerRef.current) {
      try {
        console.log("[WebRTC] Applying new remote signal");
        peerRef.current.signal(signal);
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }
  }, []);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
  }, []);

  return {
    setupPeerConnection,
    signalPeer,
    destroyPeer,
    peerRef,
  };
}

