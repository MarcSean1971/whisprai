import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { ConnectionStatus } from "./types";
import { isIceCandidateSignal } from "./ice-connection/types";
import { getIceServers } from "./ice-connection/get-ice-servers";
import { useConnectionState } from "./ice-connection/use-connection-state";

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

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    clearConnectionTimeout();
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: getIceServers()
      }
    };
    
    const p = new Peer(peerOptions);
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

    p.on("signal", data => {
      console.log("[WebRTC] Generated signal:", data.type || "ICE candidate");
      onSignal(data);
      
      if (isIceCandidateSignal(data)) {
        connectionStatsRef.current.iceCandidates++;
        connectionStatsRef.current.lastActivity = Date.now();
        setIceCandidate(prev => prev + 1);
      }
    });

    p.on("connect", () => {
      console.log("[WebRTC] Peer connection established!");
      setConnectionStatus("connected");
      onConnect();
      
      if (connectionTimeoutRef.current) {
        window.clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
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
    
    const rtcPeerConnection = (p as any)._pc;
    if (rtcPeerConnection) {
      setIsIceGathering(true);
      
      rtcPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          console.log("[WebRTC] New ICE candidate:", event.candidate.candidate);
        } else {
          console.log("[WebRTC] All ICE candidates gathered");
          setIsIceGathering(false);
        }
      };
      
      rtcPeerConnection.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", rtcPeerConnection.iceConnectionState);
        connectionStatsRef.current.iceConnectionState = rtcPeerConnection.iceConnectionState;
        connectionStatsRef.current.lastActivity = Date.now();
        
        if (rtcPeerConnection.iceConnectionState === 'failed') {
          console.warn("[WebRTC] ICE connection failed, possibly blocked by firewall/NAT");
          toast.error("Connection failed. Network restrictions may be blocking the call.");
        }
      };
      
      rtcPeerConnection.onicegatheringstatechange = () => {
        console.log("[WebRTC] ICE gathering state:", rtcPeerConnection.iceGatheringState);
        connectionStatsRef.current.iceGatheringState = rtcPeerConnection.iceGatheringState;
        connectionStatsRef.current.lastActivity = Date.now();
        
        if (rtcPeerConnection.iceGatheringState === 'complete') {
          setIsIceGathering(false);
        }
      };
      
      rtcPeerConnection.onsignalingstatechange = () => {
        console.log("[WebRTC] Signaling state:", rtcPeerConnection.signalingState);
        connectionStatsRef.current.signalingState = rtcPeerConnection.signalingState;
        connectionStatsRef.current.lastActivity = Date.now();
      };
      
      rtcPeerConnection.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", rtcPeerConnection.connectionState);
        connectionStatsRef.current.connectionState = rtcPeerConnection.connectionState;
        connectionStatsRef.current.lastActivity = Date.now();
        
        if (rtcPeerConnection.connectionState === 'connected') {
          console.log("[WebRTC] Successfully connected!");
          
          if (connectionTimeoutRef.current) {
            window.clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        }
      };
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
  }, [initiator, localStream, onSignal, onConnect, onStream, onClose, onError, remoteSignal, setConnectionStatus, clearConnectionTimeout]);

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
  }, []);

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
