
import { useRef, useState, useCallback, useEffect } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { WebRTCPeerOptions, UseWebRTCPeerReturn, ConnectionStatus } from "./webrtc/types";
import { useMediaStream } from "./webrtc/use-media-stream";
import { useScreenSharing } from "./webrtc/use-screen-sharing";
import { useCallDuration } from "./webrtc/use-call-duration";

export function useWebRTCPeer({
  initiator,
  onSignal,
  remoteSignal,
}: WebRTCPeerOptions): UseWebRTCPeerReturn {
  const peerRef = useRef<Peer.Instance | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initiator ? "calling" : "incoming");

  const { localStream, originalStreamRef, setLocalStream } = useMediaStream();
  const { isScreenSharing, screenStreamRef, setIsScreenSharing, cleanupScreenShare } = useScreenSharing();
  const { callDuration, durationTimerRef, setCallDuration } = useCallDuration(connectionStatus === "connected");

  useEffect(() => {
    if (!localStream) return;
    
    console.log("[WebRTC] Setting up peer connection, initiator:", initiator);
    setConnectionStatus(initiator ? "calling" : "incoming");
    setIsConnecting(true);

    const peerOptions: Peer.Options = {
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    };
    
    const p = new Peer(peerOptions);
    peerRef.current = p;

    p.on("signal", data => {
      console.log("[WebRTC] Generated signal");
      onSignal(data);
    });

    p.on("connect", () => {
      console.log("[WebRTC] Peer connection established!");
      setIsConnecting(false);
      setConnectionStatus("connected");
      toast.success("Call connected");
    });

    p.on("stream", remote => {
      console.log("[WebRTC] Received remote stream");
      setRemoteStream(remote);
    });

    p.on("error", err => {
      console.error("[WebRTC] Peer connection error:", err);
      toast.error(`Connection error: ${err.message}`);
      setConnectionStatus("error");
    });

    p.on("close", () => {
      console.log("[WebRTC] Peer connection closed");
      setConnectionStatus("ended");
    });

    if (remoteSignal) {
      try {
        console.log("[WebRTC] Applying remote signal");
        p.signal(remoteSignal);
        setConnectionStatus("connecting");
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }

    return () => {
      try {
        p.destroy();
      } catch (e) {
        console.error("[WebRTC] Error destroying peer:", e);
      }
    };
  }, [initiator, localStream, onSignal]);

  useEffect(() => {
    if (peerRef.current && remoteSignal) {
      try {
        console.log("[WebRTC] Applying new remote signal");
        peerRef.current.signal(remoteSignal);
        if (connectionStatus === "incoming") {
          setConnectionStatus("connecting");
        }
      } catch (e) {
        console.error("[WebRTC] Error applying remote signal:", e);
      }
    }
  }, [remoteSignal, connectionStatus]);

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
