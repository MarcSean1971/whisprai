
import { useEffect, useRef } from "react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageLengthRef = useRef<number>(0);
  
  // Store previous scroll info
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  // Initial scroll to bottom and handle new messages
  useEffect(() => {
    if (!messages.length) return;

    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) return;

    // Check if new messages were added
    const isNewMessage = messages.length > lastMessageLengthRef.current;
    lastMessageLengthRef.current = messages.length;

    // If loading older messages, preserve scroll position
    if (isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
      return;
    }

    // Scroll to bottom for new messages or initial load
    if (isNewMessage) {
      console.log('New message detected, scrolling to bottom');
      endRef.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isFetchingNextPage]);

  // Restore scroll position after loading older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isFetchingNextPage) {
      const heightDifference = container.scrollHeight - previousScrollHeight.current;
      if (heightDifference > 0) {
        console.log('Restoring scroll position after loading more messages');
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = previousScrollTop.current + heightDifference;
          }
        });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

    console.log('Setting up Intersection Observer', {
      hasNextPage,
      isFetchingNextPage,
      refetchAvailable: !!refetch
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Loading more messages - intersection detected');
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
  }, [refetch, hasNextPage, isFetchingNextPage]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef
  };
}
