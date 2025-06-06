
import { useEffect, useRef } from "react";

interface UseMessageScrollProps {
  messages: any[];
  fetchNextPage?: () => Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function useMessageScroll({ 
  messages, 
  fetchNextPage, 
  hasNextPage = false,
  isFetchingNextPage = false 
}: UseMessageScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottom = useRef(false);
  const isUserScrolling = useRef(false);
  
  // Store previous scroll info
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  // Initial scroll to bottom when messages are first loaded
  useEffect(() => {
    if (
      messages.length > 0 && 
      !isFetchingNextPage && 
      messagesEndRef.current && 
      !hasScrolledToBottom.current
    ) {
      console.log('Scrolling to bottom on initial load');
      messagesEndRef.current.scrollIntoView({ block: "end" });
      hasScrolledToBottom.current = true;
    }
  }, [messages, isFetchingNextPage]);

  // Preserve scroll position when loading older messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
      previousScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, [messages.length]);

  // Restore scroll position after loading older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && !isUserScrolling.current) {
      const heightDifference = container.scrollHeight - previousScrollHeight.current;
      if (heightDifference > 0 && isFetchingNextPage) {
        console.log('Restoring scroll position after loading more messages');
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = previousScrollTop.current + heightDifference;
          }
        });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && messages.length > 0 && !isFetchingNextPage) {
      const isNearBottom = 
        container.scrollHeight - container.clientHeight - container.scrollTop < 100;
      
      if (isNearBottom && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Handle user scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isUserScrolling.current = true;
      // Reset after a short delay
      setTimeout(() => {
        isUserScrolling.current = false;
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!fetchNextPage || !hasNextPage || isFetchingNextPage) return;

    console.log('Setting up Intersection Observer', {
      hasNextPage,
      isFetchingNextPage,
      fetchNextPageAvailable: !!fetchNextPage
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Loading more messages - intersection detected');
          fetchNextPage();
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef
  };
}
