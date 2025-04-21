
import { useState, useCallback } from "react";
import { UseWebRTCPeerReturn, WebRTCPeerOptions, ConnectionStatus } from "./webrtc/types";
import { useMediaStream } from "./webrtc/use-media-stream";
import { useScreenSharing } from "./webrtc/use-screen-sharing";
import { useCallDuration } from "./webrtc/use-call-duration";
import { usePeerConnection } from "./webrtc/use-peer-connection";
import { useScreenShareHandler } from "./webrtc/use-screen-share-handler";
import { useMediaControls } from "./webrtc/use-media-controls";
import { useCallCleanup } from "./webrtc/use-call-cleanup";

export function useWebRTCPeer({
  initiator,
  onSignal,
  remoteSignal,
}: WebRTCPeerOptions): UseWebRTCPeerReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initiator ? "calling" : "incoming");
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  const { localStream, originalStreamRef, setLocalStream } = useMediaStream();
  const { isScreenSharing, screenStreamRef, setIsScreenSharing, cleanupScreenShare } = useScreenSharing();
  const { callDuration, durationTimerRef, setCallDuration } = useCallDuration(connectionStatus === "connected");

  const handleConnect = useCallback(() => {
    setIsConnecting(false);
  }, []);

  const { setupPeerConnection, signalPeer, destroyPeer, peerRef, getConnectionState } = usePeerConnection({
    initiator,
    localStream,
    onSignal,
    remoteSignal,
    onConnect: handleConnect,
    onStream: setRemoteStream,
    onClose: () => setConnectionStatus("ended"),
    onError: () => {},
    setConnectionStatus,
  });

  const { toggleScreenShare } = useScreenShareHandler({
    peerRef,
    localStream,
    originalStreamRef,
    screenStreamRef,
    setLocalStream,
    setIsScreenSharing,
    isScreenSharing,
    cleanupScreenShare
  });

  const { toggleAudio, toggleVideo } = useMediaControls({ localStream });

  const { endCall } = useCallCleanup({
    localStream,
    cleanupScreenShare,
    destroyPeer,
    durationTimerRef,
    setLocalStream,
    setRemoteStream,
    setConnectionStatus,
    setCallDuration
  });

  const handleToggleAudio = () => {
    const newState = toggleAudio();
    setIsAudioMuted(!newState);
  };

  const handleToggleVideo = () => {
    const newState = toggleVideo();
    setIsVideoMuted(!newState);
  };

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    toggleAudio: handleToggleAudio,
    isVideoMuted,
    toggleVideo: handleToggleVideo,
    endCall,
    isConnecting,
    callStatus: connectionStatus,
    isScreenSharing,
    toggleScreenShare,
    callDuration,
    connectionDetails
  };
}
