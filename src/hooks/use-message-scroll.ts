
import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

const PULL_THRESHOLD = 60; // Reduced threshold for better mobile UX

export function useMessageScroll({ 
  messages, 
  refetch, 
  hasNextPage = false,
  isFetchingNextPage = false 
}: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
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
      // Allow pull even when slightly scrolled down
      if (container.scrollTop <= 5 && hasNextPage) {
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
      
      if (diff > 0 && container.scrollTop <= 5) {
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

      const shouldRefetch = pullProgress >= 100 && refetch && !isFetchingNextPage && hasNextPage;
      
      if (shouldRefetch) {
        try {
          await refetch();
        } catch (err) {
          console.error('Error fetching more messages:', err);
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
  }, [pullProgress, refetch, isFetchingNextPage, hasNextPage]);

  // Scroll handling for new messages
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

  // Handle scroll position preservation when loading older messages
  useEffect(() => {
    if (scrollContainerRef.current && !isFetchingNextPage) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        container.scrollTop = previousScrollTop.current + heightDifference;
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Intersection Observer for infinite loading
  useEffect(() => {
    if (!refetch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingNextPage && hasNextPage) {
          console.log('Intersection observed, fetching more messages...');
          refetch();
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
  }, [refetch, isFetchingNextPage, hasNextPage]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef,
    isLoadingMore: isFetchingNextPage,
    pullProgress,
    isPulling
  };
}
