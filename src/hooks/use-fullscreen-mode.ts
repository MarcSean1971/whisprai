
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface UseFullscreenModeProps {
  enabled?: boolean;
}

export function useFullscreenMode({ enabled = false }: UseFullscreenModeProps = {}) {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          if ('wakeLock' in navigator) {
            // Release wake lock if it exists
            (navigator as any).wakeLock.release?.()
              .catch(err => console.error('Wake Lock release error:', err));
          }
        })
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  }, []);

  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          if ('wakeLock' in navigator) {
            (navigator as any).wakeLock.request('screen')
              .catch(err => console.error('Wake Lock error:', err));
          }
        })
        .catch(err => console.error('Error attempting to enable fullscreen:', err));
    }
  }, []);

  useEffect(() => {
    // Only enable fullscreen if explicitly enabled AND on mobile
    if (!enabled || !isMobile) {
      exitFullscreen();
      return;
    }
    
    const enableFullscreen = () => {
      requestFullscreen();
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    };

    enableFullscreen();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMobile) {
        enableFullscreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      exitFullscreen();
    };
  }, [isMobile, requestFullscreen, exitFullscreen, enabled]);

  return { isFullscreen };
}

