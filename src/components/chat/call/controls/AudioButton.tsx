
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface AudioButtonProps {
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export function AudioButton({ isAudioMuted, onToggleAudio }: AudioButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-12 w-12 rounded-full ${
        isAudioMuted
          ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600"
          : "bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
      }`}
      onClick={onToggleAudio}
      aria-label={isAudioMuted ? "Unmute mic" : "Mute mic"}
    >
      {isAudioMuted ? <MicOff /> : <Mic />}
    </Button>
  );
}
