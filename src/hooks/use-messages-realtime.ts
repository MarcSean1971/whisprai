
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useMessagesRealtime(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create a unique channel name
    const channelName = conversationId 
      ? `messages:${conversationId}` 
      : 'messages:global';
      
    // Subscribe to messages
    const messagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {})
      }, (payload) => {
        console.log('Messages real-time update:', payload);
        // Invalidate related queries
        if (conversationId) {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      })
      .subscribe((status) => {
        console.log(`Messages channel ${channelName} status:`, status);
      });

    // Subscribe to message_reads changes
    const readsChannelName = conversationId 
      ? `reads:${conversationId}` 
      : 'reads:global';
      
    const readsChannel = supabase
      .channel(readsChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reads',
        ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {})
      }, (payload) => {
        console.log('Message reads real-time update:', payload);
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      })
      .subscribe((status) => {
        console.log(`Message reads channel ${readsChannelName} status:`, status);
      });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [conversationId, queryClient]);
}
