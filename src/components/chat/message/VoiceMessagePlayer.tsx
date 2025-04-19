
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
  }, [voiceMessagePath, audioUrl]);

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

  return (
    <div className="flex items-center space-x-2 bg-secondary/20 rounded-full p-1">
      {error ? (
        <>
          <div className="flex items-center text-destructive text-xs px-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Audio error</span>
          </div>
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
