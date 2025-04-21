
import { useCallback } from "react";
import { toast } from "sonner";

interface UseScreenShareHandlerProps {
  peerRef: React.MutableRefObject<any>;
  localStream: MediaStream | null;
  originalStreamRef: React.MutableRefObject<MediaStream | null>;
  screenStreamRef: React.MutableRefObject<MediaStream | null>;
  setLocalStream: (stream: MediaStream | null) => void;
  setIsScreenSharing: (value: boolean) => void;
  isScreenSharing: boolean;
  cleanupScreenShare: () => void;
}

export function useScreenShareHandler({
  peerRef,
  localStream,
  originalStreamRef,
  screenStreamRef,
  setLocalStream,
  setIsScreenSharing,
  isScreenSharing,
  cleanupScreenShare
}: UseScreenShareHandlerProps) {
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
  }, [isScreenSharing, localStream, cleanupScreenShare, originalStreamRef, screenStreamRef, setIsScreenSharing, setLocalStream, peerRef]);

  return { toggleScreenShare };
}
