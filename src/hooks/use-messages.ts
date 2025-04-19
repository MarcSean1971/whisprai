
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export interface Message {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  sender_id: string | null;
  status: string;
  original_language?: string | null;
  sender?: {
    id: string;
    profiles?: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
      language?: string;
    }
  };
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) {
      console.warn('No conversation ID provided');
      return;
    }

    // Subscribe to both messages and ai_messages tables
    const messagesChannel = supabase
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
          queryClient.invalidateQueries(['messages', conversationId]);
        }
      )
      .subscribe();

    const aiMessagesChannel = supabase
      .channel(`ai_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('AI Messages event received:', payload);
          queryClient.invalidateQueries(['messages', conversationId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(aiMessagesChannel);
    };
  }, [conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      try {
        if (!conversationId) {
          throw new Error('No conversation ID provided');
        }

        const { data: user } = await supabase.auth.getUser();
        const userId = user.user?.id;

        // Fetch regular messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch AI messages
        const { data: aiMessages, error: aiError } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .not('response', 'is', null)
          .eq('status', 'completed');

        if (aiError) throw aiError;

        // Convert AI messages to regular message format
        const formattedAiMessages = aiMessages?.map(ai => ({
          id: ai.id,
          content: ai.response,
          created_at: ai.updated_at,
          conversation_id: ai.conversation_id,
          sender_id: null,
          status: 'sent',
          metadata: { isAI: true, ...ai.metadata }
        })) || [];

        // Combine and sort all messages
        const allMessages = [...(messages || []), ...formattedAiMessages]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return allMessages;
      } catch (error) {
        console.error('Error in messages query:', error);
        toast.error('Failed to load messages');
        throw error;
      }
    }
  });
}
