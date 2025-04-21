
import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { ConnectionStatus } from "./types";
import { useConnectionState } from "./ice-connection/use-connection-state";
import { usePeerInit } from "./peer/use-peer-init";
import { usePeerEvents } from "./peer/use-peer-events";
import { useRTCConnection } from "./peer/use-rtc-connection";

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
  
  const {
    isIceGathering,
    setIsIceGathering,
    iceCandidate,
    setIceCandidate,
    connectionStatsRef,
    connectionTimeoutRef,
    clearConnectionTimeout
  } = useConnectionState();

  const { createPeer } = usePeerInit({ initiator, localStream });
  
  const { setupPeerEvents } = usePeerEvents({
    onSignal,
    onConnect,
    onStream,
    onClose,
    onError,
    setConnectionStatus,
    connectionStatsRef,
    setIceCandidate,
    clearConnectionTimeout
  });

  const { setupRTCConnection } = useRTCConnection({
    setIsIceGathering,
    connectionStatsRef,
    toast
  });

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    
    const p = createPeer();
    if (!p) return;
    
    peerRef.current = p;
    
    connectionStatsRef.current = {
      connectionState: null,
      iceConnectionState: null,
      iceGatheringState: null,
      signalingState: null,
      iceCandidates: 0,
      lastActivity: Date.now()
    };
    setIceCandidate(0);

    setupPeerEvents(p);
    
    const rtcPeerConnection = (p as any)._pc;
    if (rtcPeerConnection) {
      setupRTCConnection(rtcPeerConnection);
    }

    if (remoteSignal) {
      try {
        console.log("[WebRTC] Applying remote signal:", remoteSignal.type || "ICE candidate");
        p.signal(remoteSignal);
        setConnectionStatus("connecting" as ConnectionStatus);
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }
    
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (peerRef.current && connectionStatsRef.current.connectionState !== 'connected') {
        console.warn("[WebRTC] Connection timeout after 15 seconds");
        
        const stats = connectionStatsRef.current;
        console.log("[WebRTC] Connection stats at timeout:", {
          connectionState: stats.connectionState,
          iceConnectionState: stats.iceConnectionState,
          iceGatheringState: stats.iceGatheringState,
          signalingState: stats.signalingState,
          iceCandidates: stats.iceCandidates,
          timeSinceLastActivity: Date.now() - stats.lastActivity + 'ms'
        });
        
        toast.error("Call connection timed out. Please try again.");
        
        try {
          p.destroy();
          setConnectionStatus("error" as ConnectionStatus);
        } catch (err) {
          console.error("[WebRTC] Error destroying peer on timeout:", err);
        }
      }
    }, 15000);

    return () => {
      clearConnectionTimeout();
      try {
        p.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    };
  }, [
    initiator,
    localStream,
    remoteSignal,
    setConnectionStatus,
    clearConnectionTimeout,
    createPeer,
    setupPeerEvents,
    setupRTCConnection,
    connectionStatsRef,
    connectionTimeoutRef,
    setIceCandidate
  ]);

  const signalPeer = useCallback((signal: any) => {
    if (peerRef.current) {
      try {
        console.log("[WebRTC] Applying new remote signal:", signal.type || "ICE candidate");
        peerRef.current.signal(signal);
        connectionStatsRef.current.lastActivity = Date.now();
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }
  }, [connectionStatsRef]);

  const destroyPeer = useCallback(() => {
    clearConnectionTimeout();
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
  }, [clearConnectionTimeout]);

  const getConnectionState = useCallback(() => {
    return {
      isIceGathering,
      iceCandidate,
      ...connectionStatsRef.current
    };
  }, [isIceGathering, iceCandidate]);

  return {
    setupPeerConnection,
    signalPeer,
    destroyPeer,
    peerRef,
    getConnectionState
  };
}
