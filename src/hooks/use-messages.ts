
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchMessages } from "./use-messages/fetchMessages";
import type { Message } from "./use-messages/types";
import { useConnectionManager } from "./use-connection-manager";

export type { Message } from "./use-messages/types";

const PAGE_SIZE = 20;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

interface UseMessagesReturn {
  messages: Message[];
  error: Error | null;
  isLoading: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<any>;
  isOffline: boolean;
  reconnect: () => Promise<boolean>;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const queryClient = useQueryClient();
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isOnline, refreshConnection } = useConnectionManager();

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
    staleTime: 1000 * 30, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Flatten messages and reverse to show newest at bottom
  const messages = (result.data?.pages.flat() || []).reverse();
  
  // More detailed logging
  useEffect(() => {
    console.log('Messages state:', {
      totalMessages: messages.length,
      hasNextPage: result.hasNextPage,
      isFetchingNextPage: result.isFetchingNextPage,
      isError: !!result.error,
      isLoading: result.isLoading,
      isOnline,
      conversationId
    });
  }, [messages.length, result.hasNextPage, result.isFetchingNextPage, result.error, 
       result.isLoading, isOnline, conversationId]);

  // Helper to establish subscription
  const setupSubscription = useCallback(() => {
    if (!conversationId) {
      console.warn('No conversation ID provided');
      return null;
    }

    setSubscriptionError(null); // Clear previous error before (re)subscribing
    
    try {
      const channel = supabase
        .channel(`messages:${conversationId}`)
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
              // Reset reconnect attempts on successful event
              reconnectAttemptsRef.current = 0;
            } catch (err) {
              console.error('Error invalidating queries:', err);
              setSubscriptionError(err instanceof Error ? err : new Error('Failed to process message update'));
            }
          }
        )
        .subscribe((status: any) => {
          console.log(`Subscription status for messages:${conversationId}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
            toast({
              title: "Connection Error",
              description: "Failed to connect to message service. Trying to reconnect...",
              variant: "destructive"
            });
            scheduleReconnect();
          } else if (status === 'SUBSCRIBED') {
            console.log('Messages channel subscribed successfully');
            reconnectAttemptsRef.current = 0; // Reset attempts on successful subscription
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = null;
            }
          }
        });
        
      return channel;
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setSubscriptionError(err instanceof Error ? err : new Error('Failed to subscribe to message updates'));
      scheduleReconnect();
      return null;
    }
  }, [conversationId, queryClient]);

  // Schedule reconnection attempts with incremental delay
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    const delay = RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttemptsRef.current);
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1} in ${delay}ms`);
    
    reconnectTimerRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      reconnectAttemptsRef.current++;
      
      // First refresh the auth token, then try to resubscribe
      refreshConnection().then(success => {
        if (success) {
          if (messagesChannelRef.current) {
            supabase.removeChannel(messagesChannelRef.current);
            messagesChannelRef.current = null;
          }
          messagesChannelRef.current = setupSubscription();
        } else if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      });
    }, delay);
  }, [setupSubscription, refreshConnection]);

  // Attempt manual reconnection (for user-initiated retries)
  const reconnect = useCallback(async (): Promise<boolean> => {
    try {
      // First refresh connection and auth token
      const connectionSuccess = await refreshConnection();
      if (!connectionSuccess) {
        return false;
      }
      
      // Clear any existing channel
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      
      // Clear any pending reconnect attempts
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Reset error state
      setSubscriptionError(null);
      
      // Refetch messages
      await result.refetch();
      
      // Set up new subscription
      messagesChannelRef.current = setupSubscription();
      
      // Reset reconnect attempts
      reconnectAttemptsRef.current = 0;
      
      return true;
    } catch (err) {
      console.error("Error during manual reconnection:", err);
      return false;
    }
  }, [refreshConnection, result, setupSubscription]);

  // Reset subscription error each time conversation ID changes or focus returns
  useEffect(() => {
    setSubscriptionError(null);
  }, [conversationId]);

  // Subscribe to message updates
  useEffect(() => {
    if (!conversationId) {
      return;
    }
    
    console.log(`Setting up message subscription for conversation ${conversationId}`);
    messagesChannelRef.current = setupSubscription();

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
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [conversationId, setupSubscription]);

  // Re-subscribe to message updates on visibility change (app coming back to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App returned to foreground, refreshing messages subscription');
        reconnect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reconnect]);

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError;
  
  if (error && !result.isLoading) {
    console.error('Error in useMessages hook:', error);
  }

  return {
    messages,
    error,
    isLoading: result.isLoading,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage,
    refetch: result.refetch,
    isOffline: !isOnline,
    reconnect
  };
}
