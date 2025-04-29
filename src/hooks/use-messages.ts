
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
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
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const queryClient = useQueryClient();
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // First, check if the user is authenticated before even attempting to fetch
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check failed:', error);
          toast.error('Authentication error: ' + error.message);
        } else {
          setUserId(data.user?.id || null);
          console.log('User authenticated in useMessages:', data.user?.id);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
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
    enabled: isAuthChecked && !!userId,
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

  // Reset subscription error each time conversation ID changes or focus returns
  useEffect(() => {
    setSubscriptionError(null);
  }, [conversationId]);

  // Re-subscribe to message updates on focus
  useEffect(() => {
    function handleFocusOrVisibility() {
      // clear error before trying to setup the subscription again
      setSubscriptionError(null);
      // We'll let useEffect below re-run due to dependency on conversationId
      // So we just invalidate messages here to force a refetch and re-subscription
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

  // Set up realtime subscription when user is authenticated and we have a conversation ID
  useEffect(() => {
    if (!conversationId || !userId || !isAuthChecked) {
      console.log('Prerequisites not met for realtime subscription:', {
        conversationId,
        userId,
        isAuthChecked
      });
      return;
    }
    
    console.log('Setting up realtime subscription for messages:', {
      conversationId,
      userId
    });
    
    let messagesChannel: ReturnType<typeof supabase.channel>;
    setSubscriptionError(null); // Clear previous error before (re)subscribing

    try {
      messagesChannel = supabase
        .channel(`messages:${conversationId}:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('Messages event received:', payload);
            try {
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            } catch (err) {
              console.error('Error invalidating queries:', err);
              setSubscriptionError(err instanceof Error ? err : new Error('Failed to process message update'));
            }
          }
        )
        .subscribe((status: any) => {
          console.log(`Subscription status for messages:${conversationId}:${userId}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
            toast.error('Failed to subscribe to message updates. Try refreshing.');
          } else if (status === 'SUBSCRIBED') {
            console.log('Messages channel subscribed successfully');
          }
        });
      messagesChannelRef.current = messagesChannel;
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setSubscriptionError(err instanceof Error ? err : new Error('Failed to subscribe to message updates'));
    }

    return () => {
      if (messagesChannelRef.current) {
        try {
          supabase.removeChannel(messagesChannelRef.current);
          messagesChannelRef.current = null;
          console.log('Messages channel removed cleanly');
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, [conversationId, userId, isAuthChecked, queryClient]);

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError;
  
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
