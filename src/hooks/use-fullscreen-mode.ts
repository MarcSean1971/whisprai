
import { useCallback, useEffect, useRef } from 'react';

interface UseFullscreenModeReturn {
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function useFullscreenMode(): UseFullscreenModeReturn {
  const hasRequestedFullscreen = useRef(false);

  const enable = useCallback(async () => {
    if (!document.fullscreenElement && 
        document.documentElement.requestFullscreen && 
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

  const disable = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen && hasRequestedFullscreen.current) {
      try {
        await document.exitFullscreen();
        hasRequestedFullscreen.current = false;
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      disable();
    };
  }, [disable]);

  return { enable, disable };
}
