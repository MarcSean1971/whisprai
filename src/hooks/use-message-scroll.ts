
import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

const PULL_THRESHOLD = 60;
const SCROLL_TOLERANCE = 5;

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

  // Store scroll position before loading new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= SCROLL_TOLERANCE && hasNextPage) {
        touchStartY.current = e.touches[0].clientY;
        lastTouchY.current = e.touches[0].clientY;
        initialScrollTop.current = container.scrollTop;
        console.log('Touch start:', { scrollTop: container.scrollTop });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current || !hasNextPage) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (diff > 0 && container.scrollTop <= SCROLL_TOLERANCE) {
        setIsPulling(true);
        const rubberBandedDiff = Math.pow(diff, 0.8);
        const progress = Math.min((rubberBandedDiff / PULL_THRESHOLD) * 100, 100);
        setPullProgress(progress);
        console.log('Pull progress:', progress);
        
        if (diff > 5) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartY.current) return;

      const shouldRefetch = pullProgress >= 100 && refetch && !isFetchingNextPage && hasNextPage;
      
      if (shouldRefetch) {
        console.log('Fetching more messages...');
        try {
          await refetch();
          console.log('Messages fetched successfully');
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      }
      
      setPullProgress(0);
      setIsPulling(false);
      touchStartY.current = null;
      lastTouchY.current = null;
      initialScrollTop.current = null;
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

  // Intersection Observer for infinite loading
  useEffect(() => {
    if (!refetch || !hasNextPage) return;

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
        rootMargin: '500px 0px 0px 0px' // Increased margin for earlier loading
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
    pullProgress,
    isPulling
  };
}
