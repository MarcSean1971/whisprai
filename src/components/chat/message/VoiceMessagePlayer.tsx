
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
    <div className="flex items-center space-x-2 bg-secondary/20 rounded-full p-1">
      {error ? (
        <ErrorDisplay />
      ) : (
        <>
          <AudioControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            isMuted={isMuted}
            onPlayPause={handlePlayPause}
            onToggleMute={toggleMute}
            disabled={isLoading || !!error || isDeleting}
          />

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
