
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useFullscreenMode() {
  const { isMobile, isLoading } = useIsMobile();
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
    // Only proceed if loading is complete and we're on mobile
    if (isLoading || !isMobile) {
      return;
    }

    // Request fullscreen immediately on mobile
    requestFullscreen();

    // Handle user interaction to maintain fullscreen
    const handleUserInteraction = () => {
      if (!document.fullscreenElement) {
        requestFullscreen();
      }
    };

    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('scroll', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      exitFullscreen();
    };
  }, [isMobile, isLoading, requestFullscreen, exitFullscreen]);

  return { isFullscreen };
}
