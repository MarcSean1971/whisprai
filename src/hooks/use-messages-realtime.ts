
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useMessagesRealtime(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (_) => {
        // Invalidate conversation queries to update unread counts
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      })
      .subscribe();

    // Subscribe to message_reads changes
    const readsChannel = supabase
      .channel(`reads:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reads',
        filter: `conversation_id=eq.${conversationId}`
      }, (_) => {
        // Invalidate conversation queries to update unread counts
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [conversationId, queryClient]);
}
