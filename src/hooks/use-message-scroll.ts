import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
}

const PULL_THRESHOLD = 100; // pixels needed to trigger refresh

export function useMessageScroll({ messages, refetch }: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);
  
  // New states for pull-to-refresh
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const initialScrollTop = useRef<number | null>(null);

  // Handle pull-to-refresh touch events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        initialScrollTop.current = container.scrollTop;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (diff > 0 && container.scrollTop === 0) {
        setIsPulling(true);
        const progress = Math.min((diff / PULL_THRESHOLD) * 100, 100);
        setPullProgress(progress);
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (pullProgress >= 100 && refetch && !isLoadingMore) {
        setIsLoadingMore(true);
        await refetch();
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1000);
      }
      
      touchStartY.current = null;
      initialScrollTop.current = null;
      setIsPulling(false);
      setPullProgress(0);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullProgress, refetch, isLoadingMore]);

  // Scroll to bottom only for new messages at the end
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

  // Save scroll position before loading more messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

  // Preserve scroll position when loading older messages
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

  // Handle infinite scroll for older messages at the top
  useEffect(() => {
    if (!refetch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && refetch) {
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
  }, [refetch, isLoadingMore]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef,
    isLoadingMore,
    pullProgress,
    isPulling
  };
}
