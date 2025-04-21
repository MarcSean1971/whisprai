
import { useState, useCallback, useEffect } from "react";
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
  callType = "video",
}: WebRTCPeerOptions): UseWebRTCPeerReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callType === "audio"); // Auto-mute video for audio calls
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initiator ? "calling" : "incoming");
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [peerInitialized, setPeerInitialized] = useState(false);

  const { localStream, originalStreamRef, setLocalStream } = useMediaStream(callType);
  const { isScreenSharing, screenStreamRef, setIsScreenSharing, cleanupScreenShare } = useScreenSharing();
  const { callDuration, durationTimerRef, setCallDuration } = useCallDuration(connectionStatus === "connected");

  const handleConnect = useCallback(() => {
    setIsConnecting(false);
    console.log("[WebRTC] Connection established successfully");
  }, []);

  const handleSetConnectionStatus = useCallback((status: ConnectionStatus) => {
    console.log("[WebRTC] Connection status changed to:", status);
    setConnectionStatus(status);
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
    setConnectionStatus: handleSetConnectionStatus,
  });

  // Update connection details for UI
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (peerRef.current) {
        setConnectionDetails(getConnectionState());
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [getConnectionState, peerRef]);

  // Handle remote signal updates
  useEffect(() => {
    if (remoteSignal && peerInitialized) {
      console.log("[WebRTC] Received new remote signal, applying to peer");
      signalPeer(remoteSignal);
    }
  }, [remoteSignal, signalPeer, peerInitialized]);

  // Initialize peer connection when we have the local stream
  useEffect(() => {
    if (localStream && !peerInitialized) {
      console.log("[WebRTC] Local stream ready, setting up peer connection");
      const cleanup = setupPeerConnection();
      setPeerInitialized(true);
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [localStream, peerInitialized, setupPeerConnection]);

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

  // Re-initialize peer connection if needed
  const reinitializePeerConnection = useCallback(() => {
    if (peerInitialized) {
      destroyPeer();
    }
    if (localStream) {
      console.log("[WebRTC] Re-initializing peer connection");
      setupPeerConnection();
      setPeerInitialized(true);
    }
  }, [destroyPeer, localStream, peerInitialized, setupPeerConnection]);

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
    connectionDetails,
    callType,
    setupPeerConnection: reinitializePeerConnection
  };
}
