
import React from "react";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";

interface ScreenShareButtonProps {
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
}

export function ScreenShareButton({
  isScreenSharing,
  onToggleScreenShare,
}: ScreenShareButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-12 w-12 rounded-full ${
        isScreenSharing
          ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600"
          : "bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
      }`}
      onClick={onToggleScreenShare}
      aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
    >
      <Monitor />
    </Button>
  );
}
