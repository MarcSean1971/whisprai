
import React from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

interface VideoButtonProps {
  isVideoMuted: boolean;
  onToggleVideo: () => void;
}

export function VideoButton({ isVideoMuted, onToggleVideo }: VideoButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-12 w-12 rounded-full ${
        isVideoMuted
          ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600"
          : "bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
      }`}
      onClick={onToggleVideo}
      aria-label={isVideoMuted ? "Enable video" : "Disable video"}
    >
      {isVideoMuted ? <VideoOff /> : <Video />}
    </Button>
  );
}
