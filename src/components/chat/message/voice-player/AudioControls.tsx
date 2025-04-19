
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onToggleMute: () => void;
  disabled?: boolean;
}

export function AudioControls({
  isPlaying,
  isLoading,
  isMuted,
  onPlayPause,
  onToggleMute,
  disabled = false
}: AudioControlsProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon"
      className="h-8 w-8"
      onClick={onPlayPause}
      disabled={disabled}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
}
