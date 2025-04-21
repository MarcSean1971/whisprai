import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { WebRTCPeerOptions, UseWebRTCPeerReturn, ConnectionStatus } from "./webrtc/types";
import { useMediaStream } from "./webrtc/use-media-stream";
import { useScreenSharing } from "./webrtc/use-screen-sharing";
import { useCallDuration } from "./webrtc/use-call-duration";
import { usePeerConnection } from "./webrtc/use-peer-connection";

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

  const { localStream, originalStreamRef, setLocalStream } = useMediaStream();
  const { isScreenSharing, screenStreamRef, setIsScreenSharing, cleanupScreenShare } = useScreenSharing();
  const { callDuration, durationTimerRef, setCallDuration } = useCallDuration(connectionStatus === "connected");

  const handleConnect = useCallback(() => {
    setIsConnecting(false);
  }, []);

  const { setupPeerConnection, signalPeer } = usePeerConnection({
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

  useEffect(() => {
    if (!localStream) return;
    
    setConnectionStatus(initiator ? "calling" : "incoming");
    setIsConnecting(true);

    return setupPeerConnection();
  }, [initiator, localStream, setupPeerConnection]);

  useEffect(() => {
    if (remoteSignal) {
      signalPeer(remoteSignal);
      if (connectionStatus === "incoming") {
        setConnectionStatus("connecting");
      }
    }
  }, [remoteSignal, connectionStatus, signalPeer]);

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

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      cleanupScreenShare();
      
      if (originalStreamRef.current && peerRef.current) {
        const videoTrack = originalStreamRef.current.getVideoTracks()[0];
        
        if (videoTrack && peerRef.current) {
          try {
            const pc = (peerRef.current as any)._pc;
            if (pc?.getSenders) {
              const senders = pc.getSenders();
              const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
              
              if (videoSender) {
                await videoSender.replaceTrack(videoTrack);
              }
            }
          } catch (e) {
            console.error("Error accessing peer connection for track replacement:", e);
          }
        }
        
        setLocalStream(originalStreamRef.current);
      }
      
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        if (peerRef.current) {
          const screenTrack = screenStream.getVideoTracks()[0];
          
          if (screenTrack) {
            try {
              const pc = (peerRef.current as any)._pc;
              if (pc?.getSenders) {
                const senders = pc.getSenders();
                const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
                
                if (videoSender) {
                  await videoSender.replaceTrack(screenTrack);
                }
              }
              
              screenTrack.onended = () => {
                toggleScreenShare();
              };
            } catch (e) {
              console.error("Error accessing peer connection for track replacement:", e);
            }
          }
          
          if (localStream) {
            const combinedStream = new MediaStream();
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
              combinedStream.addTrack(audioTracks[0]);
            }
            combinedStream.addTrack(screenTrack);
            setLocalStream(combinedStream);
          }
          
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.error("Error sharing screen:", err);
        toast.error("Failed to start screen sharing");
      }
    }
  }, [isScreenSharing, localStream, cleanupScreenShare, originalStreamRef, screenStreamRef, setIsScreenSharing, setLocalStream]);

  const endCall = useCallback(() => {
    console.log("[WebRTC] Ending call");
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    }
    
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    
    cleanupScreenShare();
    
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus("ended");
    setCallDuration(0);
  }, [localStream, cleanupScreenShare, durationTimerRef, setLocalStream, setCallDuration]);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    toggleAudio,
    isVideoMuted,
    toggleVideo,
    endCall,
    isConnecting,
    callStatus: connectionStatus,
    isScreenSharing,
    toggleScreenShare,
    callDuration,
  };
}
