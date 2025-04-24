
import { useEffect, useCallback, useRef } from 'react';

export function useFullscreenMode() {
  const hasRequestedFullscreen = useRef(false);

  const enableFullscreen = useCallback(async () => {
    if (!document.fullscreenElement && 
        document.documentElement.requestFullscreen && 
        window.innerWidth < 768 &&
        !hasRequestedFullscreen.current) {
      try {
        hasRequestedFullscreen.current = true;
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        hasRequestedFullscreen.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(enableFullscreen, 100);

    return () => {
      clearTimeout(timer);
      if (document.fullscreenElement && document.exitFullscreen && hasRequestedFullscreen.current) {
        document.exitFullscreen().catch(err => {
          console.error('Failed to exit fullscreen:', err);
        });
        hasRequestedFullscreen.current = false;
      }
    };
  }, [enableFullscreen]);
}
