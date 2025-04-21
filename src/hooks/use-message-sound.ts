
import { useCallback } from 'react';

export function useMessageSound() {
  const playMessageSound = useCallback(() => {
    const audio = new Audio('/sounds/message.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error playing message sound:', error);
    });
  }, []);

  return { playMessageSound };
}
