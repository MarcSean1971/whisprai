
import { useEffect, useRef } from 'react';

interface UseScrollPositionOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  isFetchingNextPage: boolean;
}

export function useScrollPosition({ 
  scrollContainerRef, 
  isFetchingNextPage 
}: UseScrollPositionOptions) {
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  useEffect(() => {
    if (isFetchingNextPage) {
      const container = scrollContainerRef.current;
      if (container) {
        previousScrollHeight.current = container.scrollHeight;
        previousScrollTop.current = container.scrollTop;
      }
      return;
    }
    
    const container = scrollContainerRef.current;
    if (!container || previousScrollHeight.current === 0) {
      return;
    }

    if (container.scrollHeight !== previousScrollHeight.current && previousScrollTop.current > 0) {
      const newScrollTop = container.scrollHeight - previousScrollHeight.current + previousScrollTop.current;
      console.log('[Scroll] Restoring scroll position after loading older messages', {
        previous: previousScrollTop.current,
        new: newScrollTop,
        heightDiff: container.scrollHeight - previousScrollHeight.current
      });
      
      container.scrollTop = newScrollTop;
      
      previousScrollHeight.current = 0;
      previousScrollTop.current = 0;
    }
  }, [scrollContainerRef, isFetchingNextPage]);
}
