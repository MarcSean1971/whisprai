
import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

export function useFullscreenMode() {
  const { isMobile, isLoading } = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasRequestedFullscreen = useRef(false);
  const fullscreenTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const requestFullscreen = useCallback(() => {
    // Only request fullscreen on mobile devices
    if (!document.fullscreenElement && 
        document.documentElement.requestFullscreen && 
        window.innerWidth < 768) { // Double-check width
      hasRequestedFullscreen.current = true;
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error attempting to enable fullscreen:', err));
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    // Only exit if we were the ones who requested fullscreen
    if (document.fullscreenElement && 
        document.exitFullscreen && 
        hasRequestedFullscreen.current) {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          hasRequestedFullscreen.current = false;
        })
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  }, []);

  useEffect(() => {
    // Only proceed if loading is complete and we're on mobile
    if (isLoading || !isMobile) {
      return;
    }

    // Add a small delay before requesting fullscreen
    fullscreenTimerRef.current = setTimeout(() => {
      requestFullscreen();
    }, 150); // Small delay to ensure route transition is complete

    // Handle user interaction to maintain fullscreen
    const handleUserInteraction = () => {
      if (!document.fullscreenElement && isMobile) {
        requestFullscreen();
      }
    };

    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('scroll', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      if (fullscreenTimerRef.current) {
        clearTimeout(fullscreenTimerRef.current);
      }
      exitFullscreen();
    };
  }, [isMobile, isLoading, requestFullscreen, exitFullscreen]);

  return { isFullscreen };
}
