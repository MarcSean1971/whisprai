
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

  useEffect(() => {
    if (scrollContainerRef.current) {
      setLastScrollHeight(scrollContainerRef.current.scrollHeight);
    }
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && messages.length > previousMessagesLength && lastScrollHeight > 0) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - lastScrollHeight;
      container.scrollTop = container.scrollTop + scrollDiff;
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength, lastScrollHeight]);

  useEffect(() => {
    if (messages.length > previousMessagesLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

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
