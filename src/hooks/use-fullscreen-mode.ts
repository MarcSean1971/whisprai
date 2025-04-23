
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface UseFullscreenModeProps {
  enabled?: boolean;
}

export function useFullscreenMode({ enabled = false }: UseFullscreenModeProps = {}) {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
    if (!enabled || !isMobile) return;
    
    const enableFullscreen = () => {
      requestFullscreen();
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    };

    enableFullscreen();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        enableFullscreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isMobile, requestFullscreen, enabled]);

  return { isFullscreen };
}
