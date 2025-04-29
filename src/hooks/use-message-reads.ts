
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useMessageReads(conversationId?: string) {
  const queryClient = useQueryClient();
  
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }
        
        // Get unread messages in this conversation
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .not('sender_id', 'eq', user.id) // Only messages not sent by current user
          .not('id', 'in', `(
            SELECT message_id FROM message_reads 
            WHERE user_id='${user.id}' AND conversation_id='${conversationId}'
          )`)
          .order('created_at', { ascending: false });
          
        if (messagesError) {
          console.error('Error fetching unread messages:', messagesError);
          return;
        }
        
        if (!messages || messages.length === 0) {
          return; // No unread messages
        }
        
        // Mark all messages as read
        const messageReads = messages.map(message => ({
          user_id: user.id,
          message_id: message.id,
          conversation_id: conversationId,
          read_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('message_reads')
          .upsert(messageReads, { 
            onConflict: 'user_id,message_id',
            ignoreDuplicates: true 
          });
          
        if (insertError) {
          console.error('Error marking messages as read:', insertError);
          return;
        }
        
        // Invalidate user conversations to update unread counts
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      } catch (error) {
        console.error('Error in markAllAsRead:', error);
      }
    }
  });

  // Auto-mark messages as read when entering a conversation
  useEffect(() => {
    if (conversationId) {
      markAllAsRead();
    }
  }, [conversationId]);

  return { markAllAsRead };
}
