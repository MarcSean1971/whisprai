
import { useState, useEffect, useRef, useCallback } from "react";
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
  const hasSubscribed = useRef<boolean>(false);

  // Reset subscription error each time conversation ID changes or focus returns
  useEffect(() => {
    setSubscriptionError(null);
  }, [conversationId]);

  // Create a stable invalidation function with useCallback
  const invalidateQueries = useCallback(() => {
    if (conversationId && queryClient) {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      console.log('Messages cache invalidated successfully');
    }
  }, [conversationId, queryClient]);

  // Handle message event separately
  const handleMessage = useCallback((payload: any) => {
    console.log('Messages event received:', payload);
    try {
      invalidateQueries();
    } catch (err) {
      console.error('Error invalidating queries:', err);
      setSubscriptionError(err instanceof Error ? err : new Error('Failed to process message update'));
    }
  }, [invalidateQueries]);

  // Set up realtime subscription when user is authenticated and we have a conversation ID
  useEffect(() => {
    if (!conversationId || !userId || !isAuthChecked || hasSubscribed.current) {
      console.log('Prerequisites not met for realtime subscription or already subscribed:', {
        conversationId,
        userId,
        isAuthChecked,
        alreadySubscribed: hasSubscribed.current
      });
      return;
    }
    
    console.log('Setting up realtime subscription for messages:', {
      conversationId,
      userId
    });
    
    setSubscriptionError(null); // Clear previous error before (re)subscribing

    try {
      const channelId = `messages:${conversationId}:${userId}`;
      console.log(`Creating channel with ID: ${channelId}`);
      
      const messagesChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          handleMessage
        )
        .subscribe((status: any) => {
          console.log(`Subscription status for ${channelId}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
            toast.error('Failed to subscribe to message updates. Try refreshing.');
          } else if (status === 'SUBSCRIBED') {
            console.log(`Messages channel ${channelId} subscribed successfully`);
            hasSubscribed.current = true;
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
          hasSubscribed.current = false;
          supabase.removeChannel(messagesChannelRef.current);
          messagesChannelRef.current = null;
          console.log('Messages channel removed cleanly');
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, [conversationId, userId, isAuthChecked, queryClient, handleMessage]);

  // Re-subscribe to message updates on focus with proper dependency tracking
  useEffect(() => {
    const handleFocusOrVisibility = () => {
      // clear error before trying to setup the subscription again
      setSubscriptionError(null);
      
      // Mark that we need to resubscribe
      if (messagesChannelRef.current) {
        hasSubscribed.current = false;
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      
      // Invalidate queries to refresh data
      invalidateQueries();
    };
    
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
  }, [invalidateQueries]);

  return { subscriptionError };
}
