
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AudioControls } from "./voice-player/AudioControls";
import { ErrorDisplay } from "./voice-player/ErrorDisplay";
import { DeleteButton } from "./voice-player/DeleteButton";
import { useAudioPlayer } from "./voice-player/use-audio-player";

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
  const audioUrl = `https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`;
  
  const {
    isPlaying,
    isLoading,
    isMuted,
    error,
    audioRef,
    handlePlayPause,
    toggleMute,
    setIsPlaying
  } = useAudioPlayer(audioUrl);

  return (
    <div className={cn(
      "relative flex items-center space-x-2 p-3 rounded-2xl",
      "bg-gradient-to-r from-whispr-purple-light to-whispr-purple",
      "shadow-lg shadow-whispr-purple/20",
      "backdrop-blur-sm border border-white/20",
      "transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
      "dark:from-whispr-purple-dark dark:to-whispr-purple",
      "dark:border-white/10 dark:shadow-whispr-purple-dark/30",
      "animate-scale-in"
    )}>
      {error ? (
        <ErrorDisplay />
      ) : (
        <>
          <div className="flex-1 flex items-center space-x-2">
            <AudioControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              isMuted={isMuted}
              onPlayPause={handlePlayPause}
              onToggleMute={toggleMute}
              disabled={isLoading || !!error || isDeleting}
            />
            
            <div className={cn(
              "h-0.5 flex-1 rounded-full bg-white/30",
              "overflow-hidden transition-all duration-300",
              isPlaying && "animate-pulse"
            )}>
              <div className={cn(
                "h-full w-full bg-white/70",
                "transform origin-left scale-x-0",
                isPlaying && "animate-[progress_2.5s_ease-in-out_infinite]"
              )} />
            </div>
          </div>

          {canDelete && (
            <DeleteButton 
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
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

