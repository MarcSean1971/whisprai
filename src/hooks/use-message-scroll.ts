
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

  // Initial scroll to bottom
  useEffect(() => {
    if (!hasInitialScroll && scrollContainerRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
      setHasInitialScroll(true);
    }
  }, [hasInitialScroll, messages.length]);

  // Scroll to bottom on new messages
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

  // Handle infinite scroll for older messages at the top
  useEffect(() => {
    if (!refetch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && refetch) {
          setIsLoadingMore(true);
          refetch();
          // Reset loading state after a short delay
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px 0px 0px' // Adjusted to focus on top loading
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
