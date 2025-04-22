
import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
}

export function useMessageScroll({ messages, refetch }: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  // Initial scroll to bottom
  useEffect(() => {
    if (!hasInitialScroll && scrollContainerRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
      setHasInitialScroll(true);
    }
  }, [hasInitialScroll, messages.length]);

  // Preserve scroll position when loading older messages
  useEffect(() => {
    if (scrollContainerRef.current && messages.length > previousMessagesLength) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    if (scrollContainerRef.current && messages.length > previousMessagesLength && !isLoadingMore) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        container.scrollTop = previousScrollTop.current + heightDifference;
      }
    }

    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength, isLoadingMore]);

  // Save scroll position before loading more messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

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
          }, 500);
        }
      },
      { 
        threshold: 0.2,
        rootMargin: '200px 0px 0px 0px' // Increased top margin to detect earlier
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
    isLoadingMore
  };
}
