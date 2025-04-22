
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMessages } from "./use-messages/fetchMessages";
import type { Message, PaginatedMessagesResponse } from "./use-messages/types";

// Re-export the Message type for other components to use
export type { Message } from "./use-messages/types";

const PAGE_SIZE = 20;

/**
 * Fetches messages for a conversationId using react-query infinite queries and real-time subscription.
 */
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    if (!conversationId) {
      console.warn('No conversation ID provided');
      return;
    }

    let messagesChannel: any;
    
    try {
      messagesChannel = supabase
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
              if (payload.eventType === 'INSERT') {
                // For new messages, increment the counter
                setNewMessageCount(count => count + 1);
                
                // After a short delay, invalidate the query to fetch new messages
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                }, 500);
              } else {
                // For updates and deletes, immediately invalidate
                queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
              }
            } catch (err) {
              console.error('Error handling realtime message update:', err);
              setSubscriptionError(err instanceof Error ? err : new Error('Failed to process message update'));
            }
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for messages:${conversationId}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
          }
        });
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setSubscriptionError(err instanceof Error ? err : new Error('Failed to subscribe to message updates'));
    }

    return () => {
      if (messagesChannel) {
        try {
          supabase.removeChannel(messagesChannel);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, [conversationId, queryClient]);

  const result = useInfiniteQuery<PaginatedMessagesResponse, Error>({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId, { 
      limit: PAGE_SIZE, 
      cursor: pageParam 
    }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
  
  // Reset new message counter when data is refetched
  useEffect(() => {
    if (!result.isLoading && !result.isFetching) {
      setNewMessageCount(0);
    }
  }, [result.isLoading, result.isFetching, result.dataUpdatedAt]);

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError;
  
  if (error && !result.isLoading) {
    console.error('Error in useMessages hook:', error);
    toast.error('Failed to load messages');
  }

  // Flatten the pages of messages into a single array
  const messages = result.data?.pages.flatMap(page => page.messages) || [];

  return {
    ...result,
    messages,
    error,
    newMessageCount,
    resetNewMessageCount: () => setNewMessageCount(0)
  };
}
