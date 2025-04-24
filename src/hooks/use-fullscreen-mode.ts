
import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';
import { toast } from 'sonner';

interface UseFullscreenModeProps {
  enabled?: boolean;
}

export function useFullscreenMode({ enabled = false }: UseFullscreenModeProps = {}) {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        if (wakeLockRef.current) {
          try {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
          } catch (err) {
            console.error('Wake Lock release error:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
    } finally {
      // Always cleanup styles
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.setProperty('--sab', '0px');
    }
  }, []);

  const requestFullscreen = useCallback(async () => {
    // Only proceed if we're on mobile and enabled is true
    if (!isMobile || !enabled) return;
    
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        
        // Try to acquire wake lock
        if ('wakeLock' in navigator) {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            
            wakeLockRef.current.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          } catch (err) {
            // Don't show error for wake lock - it's optional
            console.warn('Wake Lock not available:', err);
          }
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast.error('Could not enable fullscreen mode');
      // Cleanup on error
      exitFullscreen();
    }
  }, [isMobile, enabled, exitFullscreen]);

  useEffect(() => {
    if (!enabled || !isMobile) {
      exitFullscreen();
      return;
    }
    
    const enableFullscreen = async () => {
      await requestFullscreen();
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      
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
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            enableFullscreen();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      exitFullscreen();
    };
  }, [isMobile, requestFullscreen, exitFullscreen, enabled]);

  return { isFullscreen };
}
