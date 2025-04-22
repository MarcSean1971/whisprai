import { useRef, useCallback, useEffect } from "react";
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
  const reconnectAttemptsRef = useRef(0);
  const signalQueueRef = useRef<any[]>([]);
  const processingSignalRef = useRef(false);
  
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

  const processSignalQueue = useCallback(() => {
    if (processingSignalRef.current || signalQueueRef.current.length === 0 || !peerRef.current) {
      return;
    }
    
    processingSignalRef.current = true;
    const signal = signalQueueRef.current[0];
    
    try {
      console.log("[WebRTC] Processing signal:", signal.type || "ICE candidate");
      peerRef.current.signal(signal);
      signalQueueRef.current.shift();
      connectionStatsRef.current.lastActivity = Date.now();
      
      setTimeout(() => {
        processingSignalRef.current = false;
        if (signalQueueRef.current.length > 0) {
          processSignalQueue();
        }
      }, 50);
    } catch (e) {
      console.error("[WebRTC] Error processing signal:", e);
      processingSignalRef.current = false;
      
      setTimeout(() => {
        if (peerRef.current) {
          processSignalQueue();
        }
      }, 1000);
    }
  }, [connectionStatsRef]);

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
    
    signalQueueRef.current = [];
    processingSignalRef.current = false;
    
    const p = createPeer();
    if (!p) {
      console.error("[WebRTC] Failed to create peer");
      setConnectionStatus("error");
      return;
    }
    
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
    } else {
      console.warn("[WebRTC] RTCPeerConnection not available");
    }

    if (remoteSignal) {
      try {
        console.log("[WebRTC] Applying initial remote signal:", remoteSignal.type || "ICE candidate");
        p.signal(remoteSignal);
        setConnectionStatus("connecting");
      } catch (e) {
        console.error("[WebRTC] Error applying initial remote signal:", e);
      }
    }
    
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (peerRef.current && connectionStatsRef.current.connectionState !== 'connected') {
        console.warn("[WebRTC] Connection timeout after 30 seconds");
        
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
        
        if (reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
          console.log(`[WebRTC] Attempting reconnection in ${delay/1000}s, attempt:`, reconnectAttemptsRef.current);
          
          setTimeout(() => {
            setupPeerConnection();
          }, delay);
          return;
        }
        
        try {
          p.destroy();
          setConnectionStatus("error");
        } catch (err) {
          console.error("[WebRTC] Error destroying peer on timeout:", err);
        }
      }
    }, 30000);

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
    connectionStatsRef,
    connectionTimeoutRef,
    setIceCandidate
  ]);

  const signalPeer = useCallback((signal: any) => {
    if (!peerRef.current) {
      console.warn("[WebRTC] Received signal but peer is not initialized");
      return;
    }
    
    signalQueueRef.current.push(signal);
    console.log("[WebRTC] Added signal to queue:", signal.type || "ICE candidate", 
                "Queue length:", signalQueueRef.current.length);
    
    processSignalQueue();
    
    connectionStatsRef.current.lastActivity = Date.now();
  }, [connectionStatsRef, processSignalQueue]);

  useEffect(() => {
    if (peerRef.current && signalQueueRef.current.length > 0) {
      processSignalQueue();
    }
  }, [processSignalQueue]);

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
    signalQueueRef.current = [];
    processingSignalRef.current = false;
  }, [clearConnectionTimeout]);

  const getConnectionState = useCallback(() => {
    return {
      isIceGathering,
      iceCandidate,
      ...connectionStatsRef.current
    };
  }, [isIceGathering, iceCandidate, connectionStatsRef]);

  return {
    setupPeerConnection,
    signalPeer,
    destroyPeer,
    peerRef,
    getConnectionState
  };
}
