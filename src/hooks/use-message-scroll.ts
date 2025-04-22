import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
}

const PULL_THRESHOLD = 80; // Reduced threshold for better mobile UX

export function useMessageScroll({ messages, refetch, hasNextPage = false }: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);
  
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const initialScrollTop = useRef<number | null>(null);
  const lastTouchY = useRef<number | null>(null);
  const pullVelocity = useRef<number>(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 0 && hasNextPage) {
        touchStartY.current = e.touches[0].clientY;
        lastTouchY.current = e.touches[0].clientY;
        initialScrollTop.current = container.scrollTop;
        pullVelocity.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current || !hasNextPage) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (lastTouchY.current !== null) {
        pullVelocity.current = touchY - lastTouchY.current;
      }
      lastTouchY.current = touchY;
      
      if (diff > 0 && container.scrollTop <= 0) {
        setIsPulling(true);
        const rubberBandedDiff = Math.pow(diff, 0.8);
        const progress = Math.min((rubberBandedDiff / PULL_THRESHOLD) * 100, 100);
        setPullProgress(progress);
        
        if (diff > 5) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartY.current) return;

      const shouldRefetch = pullProgress >= 100 && refetch && !isLoadingMore && hasNextPage;
      
      const finalProgress = pullProgress + (pullVelocity.current * 2);
      
      if (shouldRefetch) {
        setIsLoadingMore(true);
        try {
          await refetch();
        } finally {
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 1000);
        }
      }
      
      setPullProgress(0);
      setIsPulling(false);
      touchStartY.current = null;
      lastTouchY.current = null;
      initialScrollTop.current = null;
      pullVelocity.current = 0;
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
  }, [pullProgress, refetch, isLoadingMore, hasNextPage]);

  useEffect(() => {
    if (scrollContainerRef.current && messages.length > previousMessagesLength) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollContainerRef.current && !isLoadingMore) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        container.scrollTop = previousScrollTop.current + heightDifference;
      }
    }
  }, [messages.length, isLoadingMore]);

  useEffect(() => {
    if (!refetch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && refetch && hasNextPage) {
          setIsLoadingMore(true);
          refetch();
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 1000);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '300px 0px 0px 0px'
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [refetch, isLoadingMore, hasNextPage]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef,
    isLoadingMore,
    pullProgress,
    isPulling
  };
}
