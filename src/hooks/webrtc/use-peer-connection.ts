
import { useRef, useCallback, useEffect } from "react";
import { ConnectionStatus } from "./types";
import { useConnectionState } from "./ice-connection/use-connection-state";
import { usePeerInit } from "./peer/use-peer-init";
import { usePeerEvents } from "./peer/use-peer-events";
import { useRTCConnection } from "./peer/use-rtc-connection";
import { useSignalQueue } from "./peer/use-signal-queue";
import { useConnectionStateManager } from "./peer/use-connection-state-manager";
import { usePeerLifecycle } from "./peer/use-peer-lifecycle";

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
  const connectionEstablishedRef = useRef(false);
  
  const {
    isIceGathering,
    setIsIceGathering,
    connectionStatsRef,
    clearConnectionTimeout,
    startConnectionTimeout
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
    setIceCandidate: () => {},
    clearConnectionTimeout
  });

  const { setupRTCConnection } = useRTCConnection({
    setIsIceGathering,
    connectionStatsRef
  });

  const { 
    processSignalQueue, 
    addSignalToQueue, 
    resetSignalState,
    signalQueueRef 
  } = useSignalQueue(peerRef, connectionStatsRef);

  const {
    getConnectionState
  } = useConnectionStateManager({ peerRef, connectionStatsRef });

  const { setupPeerConnection } = usePeerLifecycle({
    initiator,
    localStream,
    peerRef,
    connectionEstablishedRef,
    setConnectionStatus,
    setupPeerEvents,
    setupRTCConnection,
    addSignalToQueue,
    resetSignalState,
    createPeer,
    remoteSignal
  });

  const destroyPeer = useCallback(() => {
    console.log("[WebRTC] Destroying peer connection");
    clearConnectionTimeout();
    resetSignalState();
    connectionEstablishedRef.current = false;
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
    reconnectAttemptsRef.current = 0;
  }, [clearConnectionTimeout, resetSignalState]);

  useEffect(() => {
    if (remoteSignal) {
      if (peerRef.current) {
        console.log("[WebRTC] Received remote signal, adding to queue");
        addSignalToQueue(remoteSignal);
      } else {
        console.warn("[WebRTC] Received remote signal but peer is not initialized");
      }
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
