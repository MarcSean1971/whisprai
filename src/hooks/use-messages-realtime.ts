
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useMessagesRealtime(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) {
      console.log('No conversation ID provided for realtime subscription');
      return;
    }

    console.log(`Setting up realtime subscription for conversation: ${conversationId}`);
    
    try {
      // Create a unique channel name
      const channelName = `messages:${conversationId}`;
        
      // Subscribe to messages with proper filter syntax
      const messagesChannel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          console.log('Messages real-time update received:', payload);
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
        })
        .subscribe((status) => {
          console.log(`Messages channel ${channelName} status:`, status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to messages channel');
            toast.error('Connection error. Messages may not update in real-time.');
          }
        });

      // Subscribe to message_reads changes with proper filter syntax
      const readsChannelName = `reads:${conversationId}`;
        
      const readsChannel = supabase
        .channel(readsChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'message_reads',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          console.log('Message reads real-time update received:', payload);
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
        })
        .subscribe((status) => {
          console.log(`Message reads channel ${readsChannelName} status:`, status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to message reads channel');
          }
        });

      return () => {
        console.log(`Cleaning up realtime subscriptions for conversation: ${conversationId}`);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(readsChannel);
      };
    } catch (error) {
      console.error(`Error setting up realtime subscriptions:`, error);
      toast.error('Failed to setup real-time updates');
    }
  }, [conversationId, queryClient]);
}
