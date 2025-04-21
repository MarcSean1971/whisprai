
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

interface CallControlButtonsProps {
  isConnecting: boolean;
  isMicActive: boolean;
  isVideoActive: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  internalError: string | null;
}

export function CallControlButtons({
  isConnecting,
  isMicActive,
  isVideoActive,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  internalError,
}: CallControlButtonsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleAudio}
        disabled={isConnecting}
        className={!isMicActive ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50" : ""}
      >
        {isMicActive ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4 text-red-500" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleVideo}
        disabled={isConnecting}
        className={isVideoActive ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50" : ""}
      >
        {isVideoActive ? (
          <Video className="h-4 w-4 text-green-500" />
        ) : (
          <VideoOff className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={onEndCall}
        disabled={!!internalError}
      >
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  );
}
