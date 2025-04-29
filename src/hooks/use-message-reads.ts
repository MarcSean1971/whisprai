
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
        
        // First, get all messages in this conversation not sent by the current user
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id);
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }
        
        if (!messages || messages.length === 0) {
          return; // No messages to mark as read
        }
        
        // Get already read message IDs
        const { data: readMessages, error: readError } = await supabase
          .from('message_reads')
          .select('message_id')
          .eq('user_id', user.id)
          .eq('conversation_id', conversationId);
          
        if (readError) {
          console.error('Error fetching read messages:', readError);
          return;
        }
        
        // Find messages that haven't been marked as read yet
        const readMessageIds = new Set((readMessages || []).map(m => m.message_id));
        const unreadMessages = messages.filter(msg => !readMessageIds.has(msg.id));
        
        if (unreadMessages.length === 0) {
          return; // All messages are already marked as read
        }
        
        // Mark all unread messages as read
        const messageReads = unreadMessages.map(message => ({
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
