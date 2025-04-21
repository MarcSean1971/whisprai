
import { useState, useRef, useEffect } from "react";

export function useCallDuration(isConnected: boolean) {
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isConnected) {
      console.log("[WebRTC] Starting call duration timer");
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isConnected]);

  return { callDuration, durationTimerRef };
}
