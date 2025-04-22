
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

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

  // Store and restore scroll position when loading older messages
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

  // Intersection Observer for infinite scroll
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
    messagesEndRef
  };
}
