
import { useEffect, useRef, useCallback } from "react";

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
  const scrollAttemptsRef = useRef<number>(0);
  
  // Store previous scroll info for loading older messages
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) {
      console.log('Scroll refs not ready');
      return;
    }

    const maxAttempts = 3;
    scrollAttemptsRef.current += 1;

    requestAnimationFrame(() => {
      try {
        endRef.scrollIntoView({ behavior });
        lastScrollTimeRef.current = Date.now();
        scrollAttemptsRef.current = 0;
        console.log('Scrolled to bottom successfully');
      } catch (error) {
        console.error('Error scrolling:', error);
        if (scrollAttemptsRef.current < maxAttempts) {
          setTimeout(() => scrollToBottom(behavior), 100);
        }
      }
    });
  }, []);

  // Initial load scroll handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    
    if (!container || !messages.length) return;

    if (initialLoadRef.current) {
      console.log('Initial load scroll triggered');
      scrollToBottom("instant");
      initialLoadRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Handle scrolling for new messages
  useEffect(() => {
    if (!messages.length) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if new messages were added
    const isNewMessage = messages.length > lastMessageLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender?.id === currentUserId;
    
    console.log('Message update detected:', {
      isNewMessage,
      isOwnMessage,
      currentLength: messages.length,
      lastLength: lastMessageLengthRef.current,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight
    });

    lastMessageLengthRef.current = messages.length;

    // If loading older messages, store current scroll position
    if (isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
      return;
    }

    // Always scroll to bottom for new sent messages
    if (isNewMessage && isOwnMessage) {
      console.log('New sent message detected - scrolling to bottom');
      scrollToBottom();
    }
  }, [messages, isFetchingNextPage, currentUserId, scrollToBottom]);

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
