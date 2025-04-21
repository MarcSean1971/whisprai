
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useVonageLocalMedia(
  toggleAudioFn: () => boolean,
  toggleVideoFn: () => boolean
) {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleAudio = useCallback(() => {
    setIsToggling(true);
    try {
      console.log('[Vonage LocalMedia] Toggling audio, current state:', isMicActive);
      const newState = toggleAudioFn();
      setIsMicActive(newState);
      
      toast.success(newState ? 'Microphone turned on' : 'Microphone muted');
      console.log('[Vonage LocalMedia] Audio toggled, new state:', newState);
    } catch (error) {
      console.error('[Vonage LocalMedia] Error toggling audio:', error);
      toast.error('Failed to toggle microphone');
    } finally {
      setIsToggling(false);
    }
  }, [toggleAudioFn, isMicActive]);

  const handleToggleVideo = useCallback(() => {
    setIsToggling(true);
    try {
      console.log('[Vonage LocalMedia] Toggling video, current state:', isVideoActive);
      
      // Check for camera permission before enabling
      if (!isVideoActive) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(() => {
            const newState = toggleVideoFn();
            setIsVideoActive(newState);
            toast.success(newState ? 'Camera turned on' : 'Camera turned off');
            console.log('[Vonage LocalMedia] Video toggled, new state:', newState);
          })
          .catch((err) => {
            console.error('[Vonage LocalMedia] Camera permission error:', err);
            toast.error('Camera access denied. Please check permissions.');
          })
          .finally(() => {
            setIsToggling(false);
          });
      } else {
        const newState = toggleVideoFn();
        setIsVideoActive(newState);
        toast.success(newState ? 'Camera turned on' : 'Camera turned off');
        console.log('[Vonage LocalMedia] Video toggled, new state:', newState);
        setIsToggling(false);
      }
    } catch (error) {
      console.error('[Vonage LocalMedia] Error toggling video:', error);
      toast.error('Failed to toggle camera');
      setIsToggling(false);
    }
  }, [toggleVideoFn, isVideoActive]);

  // Check for browser compatibility with WebRTC
  useEffect(() => {
    const isWebRTCSupported = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
    
    if (!isWebRTCSupported) {
      console.error('[Vonage LocalMedia] WebRTC not supported in this browser');
      toast.error('Voice calls are not supported in this browser');
    }
  }, []);

  return {
    isMicActive,
    isVideoActive,
    isToggling,
    handleToggleAudio,
    handleToggleVideo
  };
}
