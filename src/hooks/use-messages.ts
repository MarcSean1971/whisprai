
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Define a more specific type for messages
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
    // Real-time subscription for messages changes (insert, update, delete)
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              return oldData ? oldData.filter(message => message.id !== payload.old.id) : [];
            });
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              return oldData ? [...oldData, payload.new as Message] : [payload.new as Message];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      // First fetch the messages without the sender join to ensure we get proper data
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Then for each message, fetch the sender information separately if needed
      const messagesWithSender: Message[] = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return message as Message;
          }

          // Fetch sender profile information
          const { data: senderData, error: senderError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, language')
            .eq('id', message.sender_id)
            .single();

          if (senderError) {
            console.warn(`Could not fetch sender for message ${message.id}:`, senderError);
            return {
              ...message,
              sender: {
                id: message.sender_id,
                profiles: undefined
              }
            } as Message;
          }

          return {
            ...message,
            sender: {
              id: message.sender_id,
              profiles: {
                first_name: senderData.first_name,
                last_name: senderData.last_name,
                avatar_url: senderData.avatar_url,
                language: senderData.language
              }
            }
          } as Message;
        })
      );

      return messagesWithSender;
    },
  });
}
