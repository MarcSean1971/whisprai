
import { useState, useRef } from "react";
import { toast } from "sonner";

export function useScreenSharing() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const cleanupScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
  };

  return {
    isScreenSharing,
    screenStreamRef,
    setIsScreenSharing,
    cleanupScreenShare
  };
}
