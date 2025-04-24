
import { useCallback, useRef } from 'react';

interface UseScrollToBottomOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function useScrollToBottom({ scrollContainerRef, messagesEndRef }: UseScrollToBottomOptions) {
  const scrollAttemptsRef = useRef<number>(0);
  const forceScrollRef = useRef<boolean>(false);
  const scrollSuccessRef = useRef<boolean>(false);
  const lastScrollTimeRef = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth", force: boolean = false) => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) {
      console.log('[Scroll] Scroll refs not ready, will retry');
      if (scrollAttemptsRef.current < 5) {
        setTimeout(() => scrollToBottom(behavior, force), 100);
        scrollAttemptsRef.current += 1;
      }
      return;
    }

    if (force) {
      forceScrollRef.current = true;
    }

    scrollSuccessRef.current = false;

    const doScroll = () => {
      try {
        console.log('[Scroll] Attempting to scroll to bottom...');
        
        const scrollHeight = container.scrollHeight;
        container.scrollTo({
          top: scrollHeight,
          behavior: behavior
        });
        
        endRef.scrollIntoView({ behavior });
        
        lastScrollTimeRef.current = Date.now();
        scrollAttemptsRef.current = 0;
        forceScrollRef.current = false;
        scrollSuccessRef.current = true;
        
        console.log('[Scroll] Scrolled to bottom successfully');
      } catch (error) {
        console.error('[Scroll] Error scrolling:', error);
        if (scrollAttemptsRef.current < 5) {
          setTimeout(() => scrollToBottom(behavior, force), 100);
          scrollAttemptsRef.current += 1;
        }
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(doScroll);
    });
  }, [scrollContainerRef, messagesEndRef]);

  return {
    scrollToBottom,
    scrollSuccessRef,
    forceScrollRef
  };
}
