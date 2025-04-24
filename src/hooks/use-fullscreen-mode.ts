import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface UseFullscreenModeProps {
  enabled?: boolean;
}

export function useFullscreenMode({ enabled = false }: UseFullscreenModeProps = {}) {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<any>(null);
  
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          if (wakeLockRef.current) {
            wakeLockRef.current.release()
              .then(() => {
                wakeLockRef.current = null;
                console.log('Wake lock released');
              })
              .catch((err: Error) => console.error('Wake Lock release error:', err));
          }
        })
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        
        // Try to acquire wake lock to keep screen on
        if ('wakeLock' in navigator) {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            console.log('Wake lock acquired');
            
            wakeLockRef.current.addEventListener('release', () => {
              console.log('Wake lock released');
              wakeLockRef.current = null;
            });
          } catch (err) {
            console.error('Wake Lock error:', err);
          }
        }
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    }
  }, []);

  useEffect(() => {
    // Only enable fullscreen if explicitly enabled AND on mobile
    if (!enabled || !isMobile) {
      exitFullscreen();
      return;
    }
    
    const enableFullscreen = async () => {
      await requestFullscreen();
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      
      // Set CSS variable for safe area bottom
      const safeAreaBottom = window.getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-bottom)') || '0px';
      document.documentElement.style.setProperty('--sab', safeAreaBottom);
    };

    enableFullscreen();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMobile && enabled) {
        enableFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && enabled && isMobile) {
        // Try to re-enable fullscreen if it was exited externally
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            enableFullscreen();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      exitFullscreen();
    };
  }, [isMobile, requestFullscreen, exitFullscreen, enabled]);

  return { isFullscreen };
}
