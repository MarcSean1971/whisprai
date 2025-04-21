import { useRef, useCallback, useState, useEffect } from "react";
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

interface IceConnectionStats {
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
  iceGatheringState: RTCIceGatheringState | null;
  signalingState: RTCSignalingState | null;
  iceCandidates: number;
  lastActivity: number;
}

interface IceCandidateSignal {
  candidate: string;
  sdpMLineIndex?: number;
  sdpMid?: string;
}

function isIceCandidateSignal(signal: any): signal is IceCandidateSignal {
  return signal && 'candidate' in signal;
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
  const connectionTimeoutRef = useRef<number | null>(null);
  const connectionStatsRef = useRef<IceConnectionStats>({
    connectionState: null,
    iceConnectionState: null,
    iceGatheringState: null,
    signalingState: null,
    iceCandidates: 0,
    lastActivity: Date.now()
  });
  
  const [isIceGathering, setIsIceGathering] = useState(false);
  const [iceCandidate, setIceCandidate] = useState(0);

  const setupPeerConnection = useCallback(() => {
    if (!localStream) return;

    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    
    if (connectionTimeoutRef.current) {
      window.clearTimeout(connectionTimeoutRef.current);
    }
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          {
            urls: 'turn:global.turn.twilio.com:3478?transport=udp',
            username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
            credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
          },
          {
            urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
            username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
            credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
          },
          {
            urls: 'turn:global.turn.twilio.com:443?transport=tcp',
            username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
            credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
          }
        ]
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
        setConnectionStatus("connecting");
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
          setConnectionStatus("error");
        } catch (err) {
          console.error("[WebRTC] Error destroying peer on timeout:", err);
        }
      }
    }, 15000);

    return () => {
      if (connectionTimeoutRef.current) {
        window.clearTimeout(connectionTimeoutRef.current);
      }
      
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
        console.log("[WebRTC] Applying new remote signal:", signal.type || "ICE candidate");
        peerRef.current.signal(signal);
        connectionStatsRef.current.lastActivity = Date.now();
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }
  }, []);

  const destroyPeer = useCallback(() => {
    if (connectionTimeoutRef.current) {
      window.clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
  }, []);

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
