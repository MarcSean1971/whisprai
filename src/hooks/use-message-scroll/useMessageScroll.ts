
import { useRef } from "react";
import { useScrollToBottom } from "./useScrollToBottom";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useScrollPosition } from "./useScrollPosition";

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
}: UseMessageScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef<boolean>(true);
  const lastMessageLengthRef = useRef<number>(0);
  
  const { scrollToBottom, scrollSuccessRef, forceScrollRef } = useScrollToBottom({
    scrollContainerRef,
    messagesEndRef
  });

  useInfiniteScroll({
    loadMoreRef,
    refetch,
    hasNextPage,
    isFetchingNextPage
  });

  useScrollPosition({
    scrollContainerRef,
    isFetchingNextPage
  });

  // Initial load scroll effect
  if (!messages.length) {
    // Skip if no messages
  } else if (initialLoadRef.current) {
    console.log('[Scroll] Initial load scroll triggered');
    scrollToBottom("instant", true);
    initialLoadRef.current = false;
  }

  // Verification scroll effect
  if (!scrollSuccessRef.current && messages.length > 0 && !initialLoadRef.current) {
    console.log('[Scroll] Verification scroll triggered');
    scrollToBottom("instant", true);
  }

  // Handle new messages scrolling
  if (messages.length > 0) {
    const container = scrollContainerRef.current;
    if (container) {
      const isNewMessage = messages.length > lastMessageLengthRef.current;
      lastMessageLengthRef.current = messages.length;

      if (!isFetchingNextPage) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNewMessage && isNearBottom || forceScrollRef.current) {
          console.log('[Scroll] Triggering scroll to bottom - new message or forced scroll');
          scrollToBottom("smooth");
        }
      }
    }
  }

  return {
    scrollContainerRef,
    loadMoreRef,
    messagesEndRef,
    scrollToBottom
  };
}
