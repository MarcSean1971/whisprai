
import { useCallback } from "react";
import Peer from "simple-peer";
import { useIceServers } from "../ice-connection/use-ice-servers";

// Polyfill for process.nextTick in browser environment
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.nextTick = window.process.nextTick || function(callback: Function) {
    setTimeout(callback, 0);
  };
}

interface UsePeerInitProps {
  initiator: boolean;
  localStream: MediaStream | null;
}

export function usePeerInit({ initiator, localStream }: UsePeerInitProps) {
  const { iceServers } = useIceServers();

  const createPeer = useCallback(() => {
    if (!localStream) return null;

    console.log("[WebRTC] Creating new peer connection, initiator:", initiator);
    console.log("[WebRTC] Using ICE servers:", iceServers);
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: iceServers.length > 0 ? iceServers : [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    };
    
    try {
      return new Peer(peerOptions);
    } catch (error) {
      console.error("[WebRTC] Error creating peer:", error);
      return null;
    }
  }, [initiator, localStream, iceServers]);

  return { createPeer };
}
