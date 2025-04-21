
import { useState, useCallback } from "react";

/**
 * This handles local audio/video toggle state and dispatch.
 * The passed `toggleAudio` and `toggleVideo` must handle the underlying publisher toggling.
 */
export function useVonageLocalMedia(toggleAudio: () => boolean, toggleVideo: () => boolean) {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);

  const handleToggleAudio = useCallback(() => {
    const newState = toggleAudio();
    setIsMicActive(newState);
    return newState;
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    const newState = toggleVideo();
    setIsVideoActive(newState);
    return newState;
  }, [toggleVideo]);

  return {
    isMicActive,
    isVideoActive,
    handleToggleAudio,
    handleToggleVideo,
  };
}
