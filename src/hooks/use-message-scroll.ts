import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

const PULL_THRESHOLD = 60;

export function useMessageScroll({ 
  messages, 
  refetch, 
  hasNextPage = false,
  isFetchingNextPage = false 
}: UseMessageScrollProps) {
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);
  
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && messages.length > previousMessagesLength) {
      const heightDifference = container.scrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = previousScrollTop.current + heightDifference;
          }
        });
      }
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 0 && hasNextPage) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current || !hasNextPage) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (diff > 0 && container.scrollTop <= 0) {
        setIsPulling(true);
        const progress = Math.min((diff / PULL_THRESHOLD) * 100, 100);
        setPullProgress(progress);
        
        if (diff > 5) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartY.current) return;

      if (pullProgress >= 100 && refetch && !isFetchingNextPage && hasNextPage) {
        await refetch();
      }
      
      setPullProgress(0);
      setIsPulling(false);
      touchStartY.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [pullProgress, refetch, isFetchingNextPage, hasNextPage, isMobile]);

  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Loading more messages via Intersection Observer');
          refetch();
        }
      },
      { 
        rootMargin: '200px 0px 0px 0px',
        threshold: 0
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
      console.log('Observing loadMoreRef for infinite scroll');
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [refetch, isFetchingNextPage, hasNextPage]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef,
    pullProgress,
    isPulling
  };
}
