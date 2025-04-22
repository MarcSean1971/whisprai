
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

  // Process the signal queue one by one
  const processSignalQueue = useCallback(() => {
    if (processingSignalRef.current || signalQueueRef.current.length === 0 || !peerRef.current) {
      return;
    }
    
    processingSignalRef.current = true;
    const signal = signalQueueRef.current.shift();
    
    try {
      console.log("[WebRTC] Applying queued signal:", signal.type || "ICE candidate");
      peerRef.current.signal(signal);
      connectionStatsRef.current.lastActivity = Date.now();
    } catch (e) {
      console.error("[WebRTC] Error applying queued signal:", e);
    }
    
    processingSignalRef.current = false;
    
    // Process next item in queue if any
    if (signalQueueRef.current.length > 0) {
      setTimeout(processSignalQueue, 50); // Small delay between processing signals
    }
  }, [connectionStatsRef]);

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    
    // Clean up any existing peer
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying existing peer:", e);
      }
      peerRef.current = null;
    }
    
    // Clear signal queue
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

    // Apply any pending remote signal immediately
    if (remoteSignal) {
      try {
        console.log("[WebRTC] Applying initial remote signal:", remoteSignal.type || "ICE candidate");
        p.signal(remoteSignal);
        setConnectionStatus("connecting" as ConnectionStatus);
      } catch (e) {
        console.error("[WebRTC] Error applying initial remote signal:", e);
      }
    }
    
    // Set connection timeout
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
        
        // Attempt reconnection if this is the first timeout
        if (reconnectAttemptsRef.current < 1) {
          reconnectAttemptsRef.current++;
          console.log("[WebRTC] Attempting reconnection, attempt:", reconnectAttemptsRef.current);
          setupPeerConnection();
          return;
        }
        
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
    
    // Add signal to queue
    signalQueueRef.current.push(signal);
    console.log("[WebRTC] Added signal to queue:", signal.type || "ICE candidate", 
                "Queue length:", signalQueueRef.current.length);
    
    // Process the queue
    processSignalQueue();
    
    connectionStatsRef.current.lastActivity = Date.now();
  }, [connectionStatsRef, processSignalQueue]);

  // Process signal queue whenever peer changes
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
