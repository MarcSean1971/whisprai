import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
    console.log('Setting up realtime subscription for conversation:', conversationId);
    
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Realtime event received:', payload);
          
          if (payload.eventType === 'DELETE') {
            console.log('Processing delete event for message:', payload.old.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              if (!oldData) return [];
              const filteredData = oldData.filter(message => message.id !== payload.old.id);
              console.log('Updated messages after deletion:', filteredData.length);
              return filteredData;
            });
          } else if (payload.eventType === 'INSERT') {
            console.log('Processing insert event for message:', payload.new.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              const newData = oldData ? [...oldData, payload.new as Message] : [payload.new as Message];
              console.log('Updated messages after insertion:', newData.length);
              return newData;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for conversation:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      const messagesWithSender = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return message as Message;
          }

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
