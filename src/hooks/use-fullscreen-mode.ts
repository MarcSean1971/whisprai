
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useFullscreenMode() {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          // Request wake lock to prevent screen from dimming
          if ('wakeLock' in navigator) {
            (navigator as any).wakeLock.request('screen')
              .catch(err => console.error('Wake Lock error:', err));
          }
        })
        .catch(err => console.error('Error attempting to enable fullscreen:', err));
    }
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    
    const enableFullscreen = () => {
      requestFullscreen();
      // Set body overflow to hidden to prevent bounce effect
      document.body.style.overflow = 'hidden';
      // Prevent pull-to-refresh
      document.body.style.overscrollBehavior = 'none';
    };

    // Enable fullscreen on mount
    enableFullscreen();

    // Re-enable fullscreen on visibility change
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
  }, [isMobile, requestFullscreen]);

  return { isFullscreen };
}

