
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useMessageSubscription(
  conversationId: string,
  userId: string | null,
  isAuthChecked: boolean,
  queryClient: QueryClient
) {
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Reset subscription error each time conversation ID changes or auth state changes
  useEffect(() => {
    setSubscriptionError(null);
  }, [conversationId, userId, isAuthChecked]);

  // Re-subscribe to message updates on focus or visibility change
  useEffect(() => {
    function handleFocusOrVisibility() {
      // Only invalidate if we have the necessary data
      if (conversationId && userId && isAuthChecked) {
        console.log('Refreshing messages on focus/visibility change');
        setSubscriptionError(null);
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
  }, [conversationId, userId, isAuthChecked, queryClient]);

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
    
    // Clean up any previous subscription first
    if (messagesChannelRef.current) {
      try {
        console.log('Removing previous messages channel');
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      } catch (err) {
        console.error('Error removing previous channel:', err);
      }
    }
    
    setSubscriptionError(null); // Clear previous error before (re)subscribing

    try {
      const channelName = `messages:${conversationId}:${userId}`;
      console.log(`Creating new channel: ${channelName}`);
      
      messagesChannelRef.current = supabase
        .channel(channelName)
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
        .subscribe((status: string) => {
          console.log(`Subscription status for ${channelName}:`, status);
          if (status === 'CHANNEL_ERROR') {
            setSubscriptionError(new Error('Failed to subscribe to message updates'));
            toast.error('Failed to subscribe to message updates. Try refreshing.');
          } else if (status === 'SUBSCRIBED') {
            console.log('Messages channel subscribed successfully');
          }
        });
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

  return { subscriptionError };
}
