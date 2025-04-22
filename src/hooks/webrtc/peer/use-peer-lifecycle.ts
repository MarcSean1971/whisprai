
import { useCallback } from "react";
import { ConnectionStatus } from "../types";
import { useConnectionState } from "../ice-connection/use-connection-state";

interface UsePeerLifecycleProps {
  initiator: boolean;
  localStream: MediaStream | null;
  peerRef: React.MutableRefObject<any>;
  connectionEstablishedRef: React.MutableRefObject<boolean>;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setupPeerEvents: (peer: any) => void;
  setupRTCConnection: (rtcPeerConnection: RTCPeerConnection) => void;
  addSignalToQueue: (signal: any) => void;
  resetSignalState: () => void;
  createPeer: () => any;
  remoteSignal?: any;
}

export function usePeerLifecycle({
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
}: UsePeerLifecycleProps) {
  const {
    clearConnectionTimeout,
    startConnectionTimeout
  } = useConnectionState();

  const setupPeerConnection = useCallback(() => {
    if (!localStream) {
      console.error("[WebRTC] Cannot setup peer connection without local stream");
      return;
    }

    if (peerRef.current && connectionEstablishedRef.current) {
      console.log("[WebRTC] Peer already connected, not reinitializing");
      return;
    }

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    resetSignalState();
    
    if (peerRef.current) {
      try {
        console.log("[WebRTC] Destroying existing peer before creating new one");
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
      console.log("[WebRTC] Received new remote signal, applying to peer");
      addSignalToQueue(remoteSignal);
      setConnectionStatus("connecting");
    }
    
    startConnectionTimeout(() => {
      if (!connectionEstablishedRef.current) {
        console.warn("[WebRTC] Connection timed out");
        setConnectionStatus("error");
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
    addSignalToQueue,
    resetSignalState,
    startConnectionTimeout,
    connectionEstablishedRef,
    peerRef
  ]);

  return { setupPeerConnection };
}
