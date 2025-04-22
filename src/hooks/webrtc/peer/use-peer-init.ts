
import { useCallback } from "react";
import Peer from "simple-peer";
import { useIceServers } from "../ice-connection/use-ice-servers";

// Enhanced process.nextTick polyfill with proper timing
if (typeof window !== 'undefined') {
  if (!window.process) window.process = {} as any;
  if (!window.process.nextTick) {
    window.process.nextTick = (callback: Function, ...args: any[]) => {
      Promise.resolve().then(() => callback(...args));
    };
  }
}

interface UsePeerInitProps {
  initiator: boolean;
  localStream: MediaStream | null;
}

export function usePeerInit({ initiator, localStream }: UsePeerInitProps) {
  const { iceServers, refreshIceServers } = useIceServers();

  const createPeer = useCallback(() => {
    if (!localStream) {
      console.error("[WebRTC] Cannot create peer without local stream");
      return null;
    }

    console.log("[WebRTC] Creating new peer connection, initiator:", initiator);
    console.log("[WebRTC] Using ICE servers:", iceServers);
    
    if (!iceServers || iceServers.length === 0) {
      console.warn("[WebRTC] No ICE servers available, refreshing...");
      refreshIceServers();
    }
    
    // Enhanced ICE servers with normalized URLs
    const enhancedIceServers = iceServers.length > 0 ? iceServers.map(server => ({
      ...server,
      urls: Array.isArray(server.urls) ? server.urls : [server.urls]
    })) : [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:global.stun.twilio.com:3478'] }
    ];
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: enhancedIceServers,
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10
      },
      sdpTransform: (sdp: string) => {
        // Log SDP for debugging
        console.log("[WebRTC] SDP:", sdp.substring(0, 100) + "...");
        return sdp;
      }
    };
    
    try {
      const peer = new Peer(peerOptions);
      console.log("[WebRTC] Peer created successfully");
      return peer;
    } catch (error) {
      console.error("[WebRTC] Error creating peer:", error);
      return null;
    }
  }, [initiator, localStream, iceServers, refreshIceServers]);

  return { createPeer };
}
