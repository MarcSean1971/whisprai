
import { useCallback } from "react";
import Peer from "simple-peer";
import { useIceServers } from "../ice-connection/use-ice-servers";

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
    
    return new Peer(peerOptions);
  }, [initiator, localStream, iceServers]);

  return { createPeer };
}
