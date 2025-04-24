
import { useEffect } from 'react';

export function useFullscreenMode() {
  useEffect(() => {
    const enableFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen && window.innerWidth < 768) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enableFullscreen();

    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('Failed to exit fullscreen:', err);
        });
      }
    };
  }, []);
}
