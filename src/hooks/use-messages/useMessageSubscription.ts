
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMessageSubscription(
  conversationId: string | undefined,
  userId: string | null,
  isAuthChecked: boolean,
  queryClient: any
) {
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Reset subscription error each time conversation ID changes or focus returns
  useEffect(() => {
    setSubscriptionError(null);
  }, [conversationId]);

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
      const channelId = `messages:${conversationId}:${userId}`;
      console.log(`Creating channel with ID: ${channelId}`);
      
      messagesChannel = supabase
        .channel(channelId)
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
              console.log('Messages cache invalidated successfully');
            } catch (err) {
              console.error('Error invalidating queries:', err);
              setSubscriptionError(err instanceof Error ? err : new Error('Failed to process message update'));
            }
          }
        )
        .subscribe((status: any) => {
          console.log(`Subscription status for ${channelId}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
            toast.error('Failed to subscribe to message updates. Try refreshing.');
          } else if (status === 'SUBSCRIBED') {
            console.log(`Messages channel ${channelId} subscribed successfully`);
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
          console.log('Cleaning up messages channel subscription');
          supabase.removeChannel(messagesChannelRef.current);
          messagesChannelRef.current = null;
          console.log('Messages channel removed cleanly');
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, [conversationId, userId, isAuthChecked, queryClient]);

  // Re-subscribe to message updates on focus
  useEffect(() => {
    function handleFocusOrVisibility() {
      // clear error before trying to setup the subscription again
      setSubscriptionError(null);
      // We'll let useEffect above re-run due to dependency on conversationId
      if (conversationId && queryClient) {
        console.log('Re-subscribing to messages on focus/visibility change');
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
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

  return { subscriptionError };
}
