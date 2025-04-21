
import { useCallback } from "react";
import Peer from "simple-peer";
import { getIceServers } from "../ice-connection/get-ice-servers";

interface UsePeerInitProps {
  initiator: boolean;
  localStream: MediaStream | null;
}

export function usePeerInit({ initiator, localStream }: UsePeerInitProps) {
  const createPeer = useCallback(() => {
    if (!localStream) return null;

    console.log("[WebRTC] Creating new peer connection, initiator:", initiator);
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: getIceServers()
      }
    };
    
    return new Peer(peerOptions);
  }, [initiator, localStream]);

  return { createPeer };
}
