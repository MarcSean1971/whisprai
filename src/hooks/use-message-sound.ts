
import { useCallback } from 'react';

export function useMessageSound() {
  const playMessageSound = useCallback(() => {
    const audio = new Audio('/sounds/message.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error playing message sound:', error);
    });
  }, []);

  const playRingtoneSound = useCallback(() => {
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.volume = 0.7;
    audio.loop = true;
    const playPromise = audio.play().catch(error => {
      console.error('Error playing ringtone sound:', error);
    });
    
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  return { playMessageSound, playRingtoneSound };
}
