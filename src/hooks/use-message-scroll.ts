
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const initialScrollTop = useRef<number | null>(null);

  // Store scroll position before loading new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
      console.log("Storing scroll position:", {
        scrollHeight: previousScrollHeight.current,
        scrollTop: previousScrollTop.current
      });
    }
  }, [messages.length]);

  // Restore scroll position after loading older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && messages.length > previousMessagesLength) {
      const heightDifference = container.scrollHeight - previousScrollHeight.current;
      console.log("Height difference on new messages:", heightDifference);
      
      if (heightDifference > 0) {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = previousScrollTop.current + heightDifference;
            console.log("Restored scroll position:", container.scrollTop);
          }
        });
      }
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  // Mobile pull-to-refresh handling
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= SCROLL_TOLERANCE && hasNextPage) {
        touchStartY.current = e.touches[0].clientY;
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
        console.log('Fetching more messages via pull-to-refresh');
        try {
          await refetch();
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      }
      
      setPullProgress(0);
      setIsPulling(false);
      touchStartY.current = null;
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
  }, [pullProgress, refetch, isFetchingNextPage, hasNextPage, isMobile]);

  // Desktop infinite scroll handling
  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

    console.log("Setting up Intersection Observer");
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        console.log("Intersection Observer entry:", {
          isIntersecting: first.isIntersecting,
          isFetchingNextPage,
          hasNextPage
        });
        
        if (first.isIntersecting && !isFetchingNextPage && hasNextPage) {
          console.log('Loading more messages via intersection');
          refetch();
        }
      },
      { 
        root: scrollContainerRef.current,
        threshold: 0,
        rootMargin: '500px 0px 0px 0px'
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      console.log("Starting to observe load more element");
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
