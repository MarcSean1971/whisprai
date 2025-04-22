
import { useEffect, useRef } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRingtone = () => {
    if (audioRef.current) {
      console.log("[Ringtone] Stopping ringtone immediately");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    console.log(`[Ringtone] CallUIRingtone effect for status: ${callStatus}`);
    
    // Only play ringtone for active call states
    if (callStatus === "connecting" || callStatus === "ringing" || callStatus === "incoming") {
      if (!audioRef.current) {
        console.log("[Ringtone] Starting ringtone");
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.error('[Ringtone] Autoplay blocked:', e);
      });
    } else {
      // Immediately stop ringtone for any other status
      console.log(`[Ringtone] Stopping ringtone due to status change: ${callStatus}`);
      stopRingtone();
    }
    
    // Cleanup function to ensure audio is stopped
    return () => {
      console.log("[Ringtone] Component unmounting, stopping ringtone");
      stopRingtone();
    };
  }, [callStatus]);

  return null;
}
