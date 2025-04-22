
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
  const connectionEstablishedRef = useRef(false);
  
  const {
    isIceGathering,
    setIsIceGathering,
    iceCandidate,
    setIceCandidate,
    connectionStatsRef,
    connectionTimeoutRef,
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
    setIceCandidate,
    clearConnectionTimeout
  });

  const { setupRTCConnection } = useRTCConnection({
    setIsIceGathering,
    connectionStatsRef,
    toast: undefined
  });

  const { 
    processSignalQueue, 
    addSignalToQueue, 
    resetSignalState,
    signalQueueRef 
  } = useSignalQueue(peerRef, connectionStatsRef);
  
  const {
    isConnecting,
    setIsConnecting,
    connectionStatus,
    getConnectionState
  } = useConnectionStateManager({ peerRef, connectionStatsRef });

  const setupPeerConnection = useCallback(() => {
    if (!localStream) {
      console.error("[WebRTC] Cannot setup peer connection without local stream");
      return;
    }

    // If we already have a connected peer, don't reinitialize
    if (peerRef.current && connectionEstablishedRef.current) {
      console.log("[WebRTC] Peer already connected, not reinitializing");
      return;
    }

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    resetSignalState();
    
    // Destroy any existing peer
    if (peerRef.current) {
      try {
        console.log("[WebRTC] Destroying existing peer before creating new one");
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying existing peer:", e);
      }
      peerRef.current = null;
    }
    
    // Create new peer
    console.log("[WebRTC] Creating new peer");
    const p = createPeer();
    if (!p) {
      console.error("[WebRTC] Failed to create peer");
      setConnectionStatus("error");
      return;
    }
    
    // Set up the peer
    peerRef.current = p;
    setupPeerEvents(p);
    
    // Set up the RTC peer connection
    const rtcPeerConnection = (p as any)._pc;
    if (rtcPeerConnection) {
      setupRTCConnection(rtcPeerConnection);
    } else {
      console.warn("[WebRTC] RTCPeerConnection not available");
    }

    // Process any existing remote signals
    if (remoteSignal) {
      console.log("[WebRTC] Received new remote signal, applying to peer");
      addSignalToQueue(remoteSignal);
      setConnectionStatus("connecting");
    }
    
    // Start connection timeout
    startConnectionTimeout(() => {
      if (!connectionEstablishedRef.current) {
        console.warn("[WebRTC] Connection timed out");
        setConnectionStatus("error");
      }
    }, 30000); // 30 second timeout
    
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
    addSignalToQueue,
    resetSignalState,
    startConnectionTimeout
  ]);

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
