
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export function useAudioPlayer(audioUrl: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) {
      setError("Invalid voice message path");
      setIsLoading(false);
      return;
    }

    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleCanPlay = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleError = () => {
        console.error('Error loading audio:', audioUrl);
        setError('Failed to load audio');
        setIsLoading(false);
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      audio.load();

      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audioUrl]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
      toast.error('Failed to play voice message');
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return {
    isPlaying,
    isLoading,
    isMuted,
    error,
    audioRef,
    handlePlayPause,
    toggleMute,
    setIsPlaying
  };
}
