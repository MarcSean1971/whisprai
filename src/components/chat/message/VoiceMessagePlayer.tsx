
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceMessagePlayerProps {
  voiceMessagePath: string;
}

export function VoiceMessagePlayer({ voiceMessagePath }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing voice message:', error);
      toast.error('Failed to play voice message');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePlayPause}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <audio 
        ref={audioRef} 
        src={`https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
