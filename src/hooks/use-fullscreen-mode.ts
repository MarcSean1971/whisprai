
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useFullscreenMode() {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error attempting to enable fullscreen:', err));
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    let lastTouchTime = 0;
    let timer: number;

    const handleUserInteraction = () => {
      lastTouchTime = Date.now();
      requestFullscreen();
      
      // Clear existing timer
      if (timer) window.clearTimeout(timer);
      
      // Set new timer
      timer = window.setTimeout(() => {
        const timeSinceLastTouch = Date.now() - lastTouchTime;
        if (timeSinceLastTouch > 3000) {
          exitFullscreen();
        }
      }, 3000);
    };

    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('scroll', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      if (timer) window.clearTimeout(timer);
    };
  }, [isMobile, requestFullscreen, exitFullscreen]);

  return { isFullscreen };
}
