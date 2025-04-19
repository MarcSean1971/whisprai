
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
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
        setIsLoading(false);
        setError(null);
      };

      const handleError = (e: Event) => {
        const audioError = (e.target as HTMLAudioElement).error;
        console.error('Audio error:', audioError);
        setError(audioError?.message || 'Failed to load audio');
        setIsLoading(false);
        toast.error('Failed to load audio message');
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      // Preload audio
      audio.load();

      return () => {
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
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
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

  return (
    <div className="flex items-center space-x-2 bg-secondary/20 rounded-full p-1">
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={handlePlayPause}
        disabled={isLoading || !!error}
      >
        {isPlaying ? 
          <Pause className="h-4 w-4" /> : 
          <Play className="h-4 w-4" />
        }
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
        src={`https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`}
        onEnded={() => setIsPlaying(false)}
        controls={false}
        preload="auto"
      />
    </div>
  );
}
