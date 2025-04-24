
import { useState, useEffect } from 'react';
import { useMobile } from './use-mobile';

export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;

    const handleResize = () => {
      // If window height is significantly less than viewport height, keyboard is likely visible
      const heightDiff = window.visualViewport.height - window.innerHeight;
      setIsKeyboardVisible(heightDiff < -100); // Threshold to detect keyboard
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return isKeyboardVisible;
}
