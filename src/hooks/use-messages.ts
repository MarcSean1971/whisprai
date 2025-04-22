import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMessages } from "./use-messages/fetchMessages";
import type { Message } from "./use-messages/types";

// Re-export the Message type for other components to use
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

  const result = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId, PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: data.pages.map(page => page.messages),
      pageParams: data.pageParams,
    }),
  });

  // Flatten messages and reverse to show newest at bottom
  const messages = result.data?.pages.flat().reverse() || [];

  useEffect(() => {
    if (!conversationId) {
      console.warn('No conversation ID provided');
      return;
    }

    let messagesChannel: ReturnType<typeof supabase.channel>;
    
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
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
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

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError;
  
  if (error && !result.isLoading) {
    console.error('Error in useMessages hook:', error);
    toast.error('Failed to load messages');
  }

  return {
    messages,
    error,
    isLoading: result.isLoading,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage
  };
}
