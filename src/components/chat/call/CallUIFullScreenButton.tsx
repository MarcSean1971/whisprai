
import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface CallUIFullScreenButtonProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export function CallUIFullScreenButton({
  isFullScreen,
  onToggleFullScreen,
}: CallUIFullScreenButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-12 w-12 rounded-full bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
      onClick={onToggleFullScreen}
      aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
    >
      <Maximize2 />
    </Button>
  );
}
