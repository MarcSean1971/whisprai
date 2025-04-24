
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
  const forceScrollRef = useRef<boolean>(false);
  
  // Store previous scroll info for loading older messages
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth", force: boolean = false) => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) {
      console.log('Scroll refs not ready, will retry');
      if (scrollAttemptsRef.current < 3) {
        setTimeout(() => scrollToBottom(behavior, force), 100);
        scrollAttemptsRef.current += 1;
      }
      return;
    }

    if (force) {
      forceScrollRef.current = true;
    }

    const doScroll = () => {
      try {
        endRef.scrollIntoView({ behavior });
        lastScrollTimeRef.current = Date.now();
        scrollAttemptsRef.current = 0;
        forceScrollRef.current = false;
        console.log('Scrolled to bottom successfully');
      } catch (error) {
        console.error('Error scrolling:', error);
        if (scrollAttemptsRef.current < 3) {
          setTimeout(() => scrollToBottom(behavior, force), 100);
          scrollAttemptsRef.current += 1;
        }
      }
    };

    // Double RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(doScroll);
    });
  }, []);

  // Initial load scroll handling
  useEffect(() => {
    if (!messages.length) return;

    if (initialLoadRef.current) {
      console.log('Initial load scroll triggered');
      scrollToBottom("instant", true);
      initialLoadRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Handle new messages scrolling
  useEffect(() => {
    if (!messages.length) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > lastMessageLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender_id === currentUserId;
    
    console.log('Message update detected:', {
      isNewMessage,
      isOwnMessage,
      currentLength: messages.length,
      lastLength: lastMessageLengthRef.current,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight,
      forceScroll: forceScrollRef.current
    });

    lastMessageLengthRef.current = messages.length;

    // Skip scroll during older messages fetch
    if (isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
      return;
    }

    // Force scroll for sent messages or when forced
    if (isNewMessage && isOwnMessage) {
      console.log('Triggering scroll to bottom - new message or forced scroll');
      scrollToBottom("smooth", true);
    }
  }, [messages, isFetchingNextPage, currentUserId, scrollToBottom]);

  // Handle infinite scroll for older messages
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
    messagesEndRef,
    scrollToBottom
  };
}
