
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMessages } from "./fetchMessages";
import { useMessageSubscription } from "./useMessageSubscription";
import { useAuthCheck } from "./useAuthCheck";
import type { Message } from "./types";

export type { Message } from "./types";

const PAGE_SIZE = 20;

interface UseMessagesReturn {
  messages: Message[];
  error: Error | null;
  isLoading: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const queryClient = useQueryClient();
  const { isAuthChecked, userId, authError } = useAuthCheck();
  const { subscriptionError } = useMessageSubscription(conversationId, userId, isAuthChecked, queryClient);

  // Log auth status for debugging
  console.log('useMessages hook auth state:', { 
    conversationId,
    isAuthChecked, 
    userId, 
    hasAuthError: !!authError 
  });

  const result = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => {
      console.log('Fetching messages with pageParam:', pageParam, 'userId:', userId);
      return fetchMessages(conversationId, PAGE_SIZE, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
    select: (data) => ({
      pages: data.pages.map(page => page.messages),
      pageParams: data.pageParams,
    }),
    // Don't fetch if we haven't checked auth yet or if there's no userId
    enabled: isAuthChecked && !!userId,
    retry: 3,
    retryDelay: 1000,
  });

  // Flatten messages and reverse to show newest at bottom
  const messages = (result.data?.pages.flat() || []).reverse();
  
  // Detailed logging for debugging
  console.log('Messages loaded:', {
    totalMessages: messages.length,
    pagesCount: result.data?.pages.length || 0,
    userId,
    isAuthChecked,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    errorPresent: !!result.error || !!subscriptionError || !!authError
  });

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError || authError;
  
  if (error && !result.isLoading) {
    console.error('Error in useMessages hook:', error);
    toast.error('Failed to load messages: ' + error.message);
  }

  return {
    messages,
    error,
    isLoading: !isAuthChecked || result.isLoading,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage
  };
}
