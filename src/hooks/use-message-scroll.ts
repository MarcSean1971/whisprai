
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
  const scrollSuccessRef = useRef<boolean>(false);
  
  // Store previous scroll info for loading older messages
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth", force: boolean = false) => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef) {
      console.log('[Scroll] Scroll refs not ready, will retry');
      if (scrollAttemptsRef.current < 5) {
        setTimeout(() => scrollToBottom(behavior, force), 100);
        scrollAttemptsRef.current += 1;
      }
      return;
    }

    if (force) {
      forceScrollRef.current = true;
    }

    scrollSuccessRef.current = false;

    const doScroll = () => {
      try {
        console.log('[Scroll] Attempting to scroll to bottom...');
        
        // Try to scroll the container directly
        const scrollHeight = container.scrollHeight;
        container.scrollTo({
          top: scrollHeight,
          behavior: behavior
        });
        
        // Also try the scrollIntoView method as a backup
        endRef.scrollIntoView({ behavior });
        
        lastScrollTimeRef.current = Date.now();
        scrollAttemptsRef.current = 0;
        forceScrollRef.current = false;
        scrollSuccessRef.current = true;
        
        console.log('[Scroll] Scrolled to bottom successfully');
      } catch (error) {
        console.error('[Scroll] Error scrolling:', error);
        if (scrollAttemptsRef.current < 5) {
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
      console.log('[Scroll] Initial load scroll triggered');
      scrollToBottom("instant", true);
      initialLoadRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Add a verification scroll if we haven't successfully scrolled
  useEffect(() => {
    if (!scrollSuccessRef.current && messages.length > 0 && !initialLoadRef.current) {
      const timer = setTimeout(() => {
        console.log('[Scroll] Verification scroll triggered');
        scrollToBottom("instant", true);
      }, 500);
      
      return () => clearTimeout(timer);
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
    
    console.log('[Scroll] Message update detected:', {
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

    // Check if we're already near the bottom (within 100px) or if it's our own message
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Force scroll for sent messages, when we're near bottom, or when forced
    if ((isNewMessage && isOwnMessage) || isNearBottom || forceScrollRef.current) {
      console.log('[Scroll] Triggering scroll to bottom - new message or forced scroll');
      scrollToBottom(isOwnMessage ? "instant" : "smooth", isOwnMessage);
    }
  }, [messages, isFetchingNextPage, currentUserId, scrollToBottom]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (isFetchingNextPage) {
      return;
    }
    
    const container = scrollContainerRef.current;
    if (!container || previousScrollHeight.current === 0) {
      return;
    }

    // If we just finished fetching older messages, restore scroll position
    if (container.scrollHeight !== previousScrollHeight.current && previousScrollTop.current > 0) {
      const newScrollTop = container.scrollHeight - previousScrollHeight.current + previousScrollTop.current;
      console.log('[Scroll] Restoring scroll position after loading older messages', {
        previous: previousScrollTop.current,
        new: newScrollTop,
        heightDiff: container.scrollHeight - previousScrollHeight.current
      });
      
      container.scrollTop = newScrollTop;
      
      // Reset these values
      previousScrollHeight.current = 0;
      previousScrollTop.current = 0;
    }
  }, [messages, isFetchingNextPage]);

  // Handle infinite scroll for older messages
  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

    console.log('[Scroll] Setting up Intersection Observer', {
      hasNextPage,
      isFetchingNextPage,
      refetchAvailable: !!refetch
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('[Scroll] Loading more messages - intersection detected');
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
