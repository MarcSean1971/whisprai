import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  voiceMessagePath: string;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export function VoiceMessagePlayer({ 
  voiceMessagePath,
  onDelete,
  canDelete = false,
  isDeleting = false
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = `https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`;

  useEffect(() => {
    if (!voiceMessagePath) {
      setError("Invalid voice message path");
      setIsLoading(false);
      return;
    }

    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleCanPlay = () => {
        console.log('Audio can play now:', voiceMessagePath);
        setIsLoading(false);
        setError(null);
      };

      const handleError = (e: Event) => {
        const audioError = (e.target as HTMLAudioElement).error;
        console.error('Audio loading error:', audioError, 'for path:', voiceMessagePath, 'URL:', audioUrl);
        setError(audioError?.message || 'Failed to load audio');
        setIsLoading(false);
        
        if (loadAttempts === 0) {
          toast.error('Failed to load audio message');
        }
        
        setLoadAttempts(prev => prev + 1);
      };

      const handleLoadStart = () => {
        console.log('Audio loading started for:', voiceMessagePath);
        setIsLoading(true);
      };

      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      audio.load();

      return () => {
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [voiceMessagePath, audioUrl, loadAttempts]);

  const handlePlayPause = async () => {
    try {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio:', voiceMessagePath);
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
          console.log('Audio playing successfully');
          setIsPlaying(true);
        }
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

  const handleRetry = () => {
    if (audioRef.current) {
      setIsLoading(true);
      setError(null);
      audioRef.current.load();
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-secondary/20 rounded-full p-1">
      {error ? (
        <>
          <div className="flex items-center text-destructive text-xs px-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[120px]">Audio error</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleRetry}
            title="Retry loading audio"
          >
            <Loader2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={handlePlayPause}
            disabled={isLoading || !!error || isDeleting}
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
            disabled={isLoading || !!error || isDeleting}
          >
            {isMuted ? 
              <VolumeX className="h-4 w-4" /> : 
              <Volume2 className="h-4 w-4" />
            }
          </Button>

          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </>
      )}

      <audio 
        ref={audioRef} 
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        controls={false}
        preload="auto"
        className="hidden"
      />
    </div>
  );
}
