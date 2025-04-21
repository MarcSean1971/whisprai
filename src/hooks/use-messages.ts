
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMessages } from "./use-messages/fetchMessages";
import type { Message } from "./use-messages/types";

// Re-export the Message type for other components to use
export type { Message } from "./use-messages/types";

/**
 * Fetches messages for a conversationId using react-query and real-time subscription.
 */
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);

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
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            } catch (err) {
              console.error('Error invalidating queries:', err);
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

  const result = useQuery<Message[], Error>({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Combine subscription errors with query errors
  const error = result.error || subscriptionError;
  
  if (error && !result.isLoading) {
    console.error('Error in useMessages hook:', error);
    toast.error('Failed to load messages');
  }

  return {
    ...result,
    error
  };
}
