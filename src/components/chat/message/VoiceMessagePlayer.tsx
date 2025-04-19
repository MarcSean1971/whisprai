
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceMessagePlayerProps {
  voiceMessagePath: string;
}

export function VoiceMessagePlayer({ voiceMessagePath }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleCanPlay = () => {
        console.log('Audio can play now');
        setIsLoading(false);
        setError(null);
      };

      const handleError = (e: Event) => {
        const audioError = (e.target as HTMLAudioElement).error;
        console.error('Audio loading error:', audioError);
        setError(audioError?.message || 'Failed to load audio');
        setIsLoading(false);
        toast.error('Failed to load audio message');
      };

      const handleLoadStart = () => {
        console.log('Audio loading started');
        setIsLoading(true);
      };

      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      // Force load the audio
      audio.load();

      return () => {
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [voiceMessagePath]);

  const handlePlayPause = async () => {
    try {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        console.log('Attempting to play audio');
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
          console.log('Audio playing successfully');
        }
      }
      setIsPlaying(!isPlaying);
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

  // Full URL construction for voice messages
  const audioUrl = `https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`;

  return (
    <div className="flex items-center space-x-2 bg-secondary/20 rounded-full p-1">
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={handlePlayPause}
        disabled={isLoading || !!error}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleMute}
        disabled={isLoading || !!error}
      >
        {isMuted ? 
          <VolumeX className="h-4 w-4" /> : 
          <Volume2 className="h-4 w-4" />
        }
      </Button>

      <audio 
        ref={audioRef} 
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        controls={false}
        preload="auto"
      />
    </div>
  );
}
