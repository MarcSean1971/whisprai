
import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";

interface UseWebRTCPeerOptions {
  initiator: boolean;
  onSignal: (data: any) => void;
  remoteSignal?: any;
}

export function useWebRTCPeer({
  initiator,
  onSignal,
  remoteSignal,
}: UseWebRTCPeerOptions) {
  const peerRef = useRef<Peer.Instance | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Start local media
  useEffect(() => {
    let stopped = false;
    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (!stopped) setLocalStream(stream);
      } catch (e) {
        // Do nothing for now, could invoke a toast
      }
    }
    getMedia();
    return () => {
      stopped = true;
      // Stop tracks
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  // When we have the local stream, set up peer
  useEffect(() => {
    if (!localStream) return;
    const p = new Peer({
      initiator,
      trickle: false,
      stream: localStream,
    });
    peerRef.current = p;

    p.on("signal", onSignal);

    p.on("stream", (remote) => {
      setRemoteStream(remote);
    });

    if (remoteSignal) {
      p.signal(remoteSignal);
    }

    return () => {
      p.destroy();
    };
    // We do not include remoteSignal since we apply it dynamically below
    // eslint-disable-next-line
  }, [initiator, localStream, onSignal]);

  // Dynamically signal remote offer/answer if remoteSignal updates
  useEffect(() => {
    if (peerRef.current && remoteSignal) {
      peerRef.current.signal(remoteSignal);
    }
  }, [remoteSignal]);

  // Media controls
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsAudioMuted(!track.enabled);
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsVideoMuted(!track.enabled);
    });
  }, [localStream]);

  const endCall = useCallback(() => {
    peerRef.current?.destroy();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    toggleAudio,
    isVideoMuted,
    toggleVideo,
    endCall,
  };
}
