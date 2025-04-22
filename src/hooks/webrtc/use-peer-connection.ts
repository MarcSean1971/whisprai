
import { useRef, useCallback, useEffect } from "react";
import { ConnectionStatus } from "./types";
import { useConnectionState } from "./ice-connection/use-connection-state";
import { usePeerInit } from "./peer/use-peer-init";
import { usePeerEvents } from "./peer/use-peer-events";
import { useRTCConnection } from "./peer/use-rtc-connection";
import { useSignalQueue } from "./peer/use-signal-queue";
import { useConnectionStateManager } from "./peer/use-connection-state-manager";

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
  const peerRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  
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
    toast: undefined
  });

  const { processSignalQueue, addSignalToQueue } = useSignalQueue(peerRef, connectionStatsRef);
  
  const {
    isConnecting,
    setIsConnecting,
    connectionStatus,
    getConnectionState
  } = useConnectionStateManager({ peerRef, connectionStatsRef });

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying existing peer:", e);
      }
      peerRef.current = null;
    }
    
    const p = createPeer();
    if (!p) {
      console.error("[WebRTC] Failed to create peer");
      setConnectionStatus("error");
      return;
    }
    
    peerRef.current = p;
    setupPeerEvents(p);
    
    const rtcPeerConnection = (p as any)._pc;
    if (rtcPeerConnection) {
      setupRTCConnection(rtcPeerConnection);
    } else {
      console.warn("[WebRTC] RTCPeerConnection not available");
    }

    if (remoteSignal) {
      addSignalToQueue(remoteSignal);
      setConnectionStatus("connecting");
    }
    
    return () => {
      clearConnectionTimeout();
      try {
        if (p) p.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer in cleanup:", e);
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
    addSignalToQueue
  ]);

  const destroyPeer = useCallback(() => {
    clearConnectionTimeout();
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
    reconnectAttemptsRef.current = 0;
  }, [clearConnectionTimeout]);

  useEffect(() => {
    if (remoteSignal) {
      addSignalToQueue(remoteSignal);
    }
  }, [remoteSignal, addSignalToQueue]);

  return {
    setupPeerConnection,
    signalPeer: addSignalToQueue,
    destroyPeer,
    peerRef,
    getConnectionState
  };
}
