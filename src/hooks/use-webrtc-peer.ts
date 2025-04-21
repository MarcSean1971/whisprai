
import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";

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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>(initiator ? "calling" : "receiving");
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<number | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);
  
  // Start call duration timer
  useEffect(() => {
    if (connectionStatus === "connected") {
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [connectionStatus]);

  // Start local media
  useEffect(() => {
    let stopped = false;
    
    async function getMedia() {
      try {
        const constraints = {
          audio: true,
          video: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!stopped) {
          setLocalStream(stream);
          originalStreamRef.current = stream;
        }
      } catch (e: any) {
        if (!stopped) {
          console.error("Media error:", e);
          
          // Try fallback to audio only if video fails
          if (e.name === "NotAllowedError") {
            toast.error("Camera and microphone access denied. Please check your permissions.");
          } else if (e.name === "NotFoundError") {
            toast.error("No camera or microphone found. Trying audio only...");
            try {
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setLocalStream(audioOnlyStream);
              originalStreamRef.current = audioOnlyStream;
              setIsVideoMuted(true);
            } catch (audioErr) {
              toast.error("Could not access microphone. Call cannot proceed.");
            }
          } else {
            toast.error(`Media error: ${e.message}`);
          }
        }
      }
    }
    
    getMedia();
    
    return () => {
      stopped = true;
      // Stop tracks
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // When we have the local stream, set up peer
  useEffect(() => {
    if (!localStream) return;
    
    const peerOptions: Peer.Options = {
      initiator,
      trickle: true, // Enable ICE trickling for better connections
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
      console.log("Generated signal:", data);
      onSignal(data);
    });

    p.on("connect", () => {
      console.log("Peer connection established!");
      setIsConnecting(false);
      setConnectionStatus("connected");
      toast.success("Call connected");
    });

    p.on("stream", remote => {
      console.log("Received remote stream", remote);
      setRemoteStream(remote);
    });

    p.on("error", err => {
      console.error("Peer connection error:", err);
      toast.error(`Connection error: ${err.message}`);
    });

    p.on("close", () => {
      console.log("Peer connection closed");
      setConnectionStatus("ended");
    });

    if (remoteSignal) {
      try {
        p.signal(remoteSignal);
      } catch (e) {
        console.error("Error applying remote signal:", e);
      }
    }

    return () => {
      try {
        p.destroy();
      } catch (e) {
        console.error("Error destroying peer:", e);
      }
    };
  }, [initiator, localStream, onSignal]);

  // Dynamically signal remote offer/answer if remoteSignal updates
  useEffect(() => {
    if (peerRef.current && remoteSignal) {
      try {
        console.log("Applying remote signal:", remoteSignal);
        peerRef.current.signal(remoteSignal);
      } catch (e) {
        console.error("Error applying remote signal:", e);
      }
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

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      if (originalStreamRef.current && peerRef.current) {
        // Replace the current stream with the original camera stream
        const videoTrack = originalStreamRef.current.getVideoTracks()[0];
        
        if (videoTrack && peerRef.current) {
          try {
            // Access the native RTCPeerConnection inside simple-peer
            const pc = (peerRef.current as any)._pc;
            if (pc && pc.getSenders) {
              const senders = pc.getSenders();
              const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
              
              if (videoSender) {
                videoSender.replaceTrack(videoTrack).catch(e => {
                  console.error("Error replacing track:", e);
                });
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
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        screenStreamRef.current = screenStream;
        
        // Replace video track with screen sharing track
        if (peerRef.current) {
          const screenTrack = screenStream.getVideoTracks()[0];
          
          if (screenTrack) {
            try {
              // Access the native RTCPeerConnection inside simple-peer
              const pc = (peerRef.current as any)._pc;
              if (pc && pc.getSenders) {
                const senders = pc.getSenders();
                const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
                
                if (videoSender) {
                  videoSender.replaceTrack(screenTrack).catch(e => {
                    console.error("Error replacing track:", e);
                  });
                }
              }
              
              // Handle the screen sharing being stopped by the user via the browser UI
              screenTrack.onended = () => {
                toggleScreenShare();
              };
            } catch (e) {
              console.error("Error accessing peer connection for track replacement:", e);
            }
          }
          
          // Create a new combined stream with audio from original and video from screen
          const combinedStream = new MediaStream();
          
          // Add the audio from the original stream
          if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
              combinedStream.addTrack(audioTracks[0]);
            }
          }
          
          // Add video from screen share
          combinedStream.addTrack(screenTrack);
          
          setLocalStream(combinedStream);
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.error("Error sharing screen:", err);
        toast.error("Failed to start screen sharing");
      }
    }
  }, [isScreenSharing, localStream]);

  const endCall = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying peer:", e);
      }
    }
    
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus("ended");
    setCallDuration(0);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    toggleAudio,
    isVideoMuted,
    toggleVideo,
    endCall,
    isConnecting: isConnecting && (connectionStatus === "calling" || connectionStatus === "receiving"),
    callStatus: connectionStatus,
    isScreenSharing,
    toggleScreenShare,
    callDuration,
  };
}
