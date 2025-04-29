
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMessages } from "./use-messages/fetchMessages";
import type { Message } from "./use-messages/types";

export type { Message } from "./use-messages/types";

const PAGE_SIZE = 20;

interface UseMessagesReturn {
  messages: Message[];
  error: Error | null;
  isLoading: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  userId: string | null; // Added userId to the return type
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const queryClient = useQueryClient();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);

  // First, check if the user is authenticated before even attempting to fetch
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check failed:', error);
          toast.error('Authentication error: ' + error.message);
          setAuthError(new Error(error.message));
        } else {
          setUserId(data.user?.id || null);
          console.log('User authenticated in useMessages:', data.user?.id);
          setAuthError(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setAuthError(err instanceof Error ? err : new Error('Authentication check failed'));
      } finally {
        setIsAuthChecked(true);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useMessages:', event);
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      // If auth state changes, invalidate messages to refetch with new user context
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [conversationId, queryClient]);

  const result = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => {
      console.log('Fetching messages with pageParam:', pageParam);
      return fetchMessages(conversationId, PAGE_SIZE, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      console.log('Getting next page param:', lastPage.nextCursor);
      return lastPage.nextCursor;
    },
    select: (data) => ({
      pages: data.pages.map(page => page.messages),
      pageParams: data.pageParams,
    }),
    // Don't fetch if we haven't checked auth yet or if there's no userId
    enabled: isAuthChecked && !!userId && !!conversationId,
    retry: 3,
    retryDelay: 1000,
  });

  // Flatten messages and reverse to show newest at bottom
  const messages = (result.data?.pages.flat() || []).reverse();
  console.log('Messages loaded:', {
    totalMessages: messages.length,
    pagesCount: result.data?.pages.length || 0,
    userId,
    isAuthChecked,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage
  });

  // Re-subscribe to message updates on focus
  useEffect(() => {
    function handleFocusOrVisibility() {
      // We just invalidate messages here to force a refetch
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
    
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === "visible") {
        handleFocusOrVisibility();
      }
    });
    
    return () => {
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, [conversationId, queryClient]);

  // We're not setting up the real-time subscription here anymore as it's now moved to useMessageSubscription

  // Combine query errors with auth errors
  const error = result.error || authError;
  
  useEffect(() => {
    if (error && !result.isLoading) {
      console.error('Error in useMessages hook:', error);
      toast.error('Failed to load messages: ' + error.message);
    }
  }, [error, result.isLoading]);

  return {
    messages,
    error,
    isLoading: !isAuthChecked || result.isLoading,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage,
    userId // Return userId so it can be passed to ChatMessages
  };
}
