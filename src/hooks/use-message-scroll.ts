
import { useEffect, useRef } from "react";

interface UseMessageScrollProps {
  messages: any[];
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  currentUserId?: string | null;
}

export function useMessageScroll({ 
  messages, 
  refetch, 
  hasNextPage = false,
  isFetchingNextPage = false,
  currentUserId
}: UseMessageScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageLengthRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const initialLoadRef = useRef<boolean>(true);
  
  // Store previous scroll info for loading older messages
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  // Initial load scroll handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef || !messages.length) return;

    if (initialLoadRef.current) {
      console.log('Initial load scroll triggered');
      requestAnimationFrame(() => {
        endRef.scrollIntoView({ behavior: "instant" });
        lastScrollTimeRef.current = Date.now();
        initialLoadRef.current = false;
      });
    }
  }, [messages]);

  // Handle scrolling for new messages and initial load
  useEffect(() => {
    if (!messages.length) return;

    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) return;

    // Check if new messages were added
    const isNewMessage = messages.length > lastMessageLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender?.id === currentUserId;
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    
    console.log('Scroll check:', {
      isNewMessage,
      isOwnMessage,
      isNearBottom,
      currentLength: messages.length,
      lastLength: lastMessageLengthRef.current,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight,
      timeSinceLastScroll: Date.now() - lastScrollTimeRef.current,
      isInitialLoad: initialLoadRef.current
    });

    lastMessageLengthRef.current = messages.length;

    // If loading older messages, store current scroll position
    if (isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
      return;
    }

    // Always scroll to bottom for own messages or if near bottom for others
    if (isNewMessage && (isOwnMessage || isNearBottom)) {
      console.log('Scrolling to latest message:', { isOwnMessage, isNearBottom });
      
      // Use requestAnimationFrame to ensure content is rendered
      requestAnimationFrame(() => {
        endRef.scrollIntoView({ behavior: "smooth" });
        lastScrollTimeRef.current = Date.now();
      });
    }
  }, [messages, isFetchingNextPage, currentUserId]);

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

