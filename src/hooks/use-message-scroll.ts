
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
  const hasScrolledToBottom = useRef(false);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);
  const lastMessageSender = useRef<string | null>(null);

  // Initial scroll to bottom when messages are first loaded
  useEffect(() => {
    if (
      messages.length > 0 && 
      !isFetchingNextPage && 
      messagesEndRef.current && 
      !hasScrolledToBottom.current
    ) {
      console.log('Scrolling to bottom on initial load');
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
      hasScrolledToBottom.current = true;
    }
  }, [messages, isFetchingNextPage]);

  // Auto-scroll on new message if it's from current user or if already near bottom
  useEffect(() => {
    if (!messages.length || !scrollContainerRef.current || !messagesEndRef.current) return;

    const container = scrollContainerRef.current;
    const lastMessage = messages[messages.length - 1];
    const isFromCurrentUser = lastMessage?.sender_id === currentUserId;
    
    // Check if we're already near the bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (lastMessage?.sender_id !== lastMessageSender.current) {
      lastMessageSender.current = lastMessage?.sender_id;
      
      if (isFromCurrentUser || isNearBottom) {
        console.log('Auto-scrolling to new message');
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, currentUserId]);

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
    if (container) {
      const heightDifference = container.scrollHeight - previousScrollHeight.current;
      if (heightDifference > 0) {
        console.log('Restoring scroll position after loading more messages');
        console.log('Height difference:', heightDifference);
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = previousScrollTop.current + heightDifference;
          }
        });
      }
    }
  }, [messages.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

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
    messagesEndRef
  };
}
