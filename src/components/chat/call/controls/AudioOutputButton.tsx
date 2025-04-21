
import React from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface AudioOutputButtonProps {
  remoteAudioMuted: boolean;
  onToggleRemoteAudio: () => void;
}

export function AudioOutputButton({
  remoteAudioMuted,
  onToggleRemoteAudio,
}: AudioOutputButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-12 w-12 rounded-full ${
        remoteAudioMuted
          ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600"
          : "bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
      }`}
      onClick={onToggleRemoteAudio}
      aria-label={remoteAudioMuted ? "Unmute call" : "Mute call"}
    >
      {remoteAudioMuted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}
