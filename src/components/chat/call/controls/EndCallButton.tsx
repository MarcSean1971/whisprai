
import React from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

interface EndCallButtonProps {
  onEndCall: () => void;
}

export function EndCallButton({ onEndCall }: EndCallButtonProps) {
  return (
    <Button
      variant="destructive"
      size="icon"
      className="h-12 w-12 rounded-full"
      onClick={onEndCall}
      aria-label="End call"
    >
      <PhoneOff />
    </Button>
  );
}
