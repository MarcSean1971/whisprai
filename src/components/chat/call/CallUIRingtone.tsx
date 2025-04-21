
import { useEffect } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  useEffect(() => {
    const audio = new Audio('/sounds/ringtone.mp3');
    if (callStatus === 'connecting' || callStatus === 'ringing') {
      audio.loop = true;
      audio.play().catch(e => console.error('Could not play ringtone:', e));
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [callStatus]);

  return null; // Just handles sound
}
