
import { useCallback } from "react";

interface UseMediaControlsProps {
  localStream: MediaStream | null;
}

export function useMediaControls({ localStream }: UseMediaControlsProps) {
  const toggleAudio = useCallback(() => {
    if (!localStream) return false;
    const audioTracks = localStream.getAudioTracks();
    const newState = !audioTracks[0]?.enabled;
    audioTracks.forEach((track) => {
      track.enabled = newState;
    });
    return newState;
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return false;
    const videoTracks = localStream.getVideoTracks();
    const newState = !videoTracks[0]?.enabled;
    videoTracks.forEach((track) => {
      track.enabled = newState;
    });
    return newState;
  }, [localStream]);

  return { toggleAudio, toggleVideo };
}
