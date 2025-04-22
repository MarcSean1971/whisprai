
import { useEffect, useRef, useState } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
}

export function useMessageScroll({ messages, refetch }: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (scrollContainerRef.current && messages.length > previousMessagesLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  // Handle infinite scroll for older messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && refetch) {
          refetch();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
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
  }, [refetch]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef
  };
}
