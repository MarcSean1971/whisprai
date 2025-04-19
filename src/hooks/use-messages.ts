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

    console.log('Setting up realtime subscription for conversation:', conversationId);
    
    const channel = supabase
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
          console.log('Realtime event received:', payload);
          
          if (payload.eventType === 'DELETE') {
            console.log('Processing delete event for message:', payload.old.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              if (!oldData) return [];
              return oldData.filter(message => message.id !== payload.old.id);
            });
          } else if (payload.eventType === 'INSERT') {
            console.log('Processing insert event for message:', payload.new.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              const newMessage = payload.new as Message;
              return oldData ? [...oldData, newMessage] : [newMessage];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${conversationId}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to messages');
          toast.error('Failed to connect to chat. Please refresh the page.');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription for conversation:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      try {
        if (!conversationId) {
          throw new Error('No conversation ID provided');
        }

        // First fetch messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }

        if (!messages) {
          return [];
        }

        // Then fetch sender profiles for all messages with a sender
        const senderIds = messages
          .filter(m => m.sender_id)
          .map(m => m.sender_id as string);

        if (senderIds.length === 0) {
          return messages as Message[];
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, language')
          .in('id', senderIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
          // Continue with messages even if profiles fail to load
          return messages as Message[];
        }

        // Map profiles to messages
        return messages.map(message => {
          if (!message.sender_id) {
            return message as Message;
          }

          const profile = profiles?.find(p => p.id === message.sender_id);
          return {
            ...message,
            sender: profile ? {
              id: message.sender_id,
              profiles: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                avatar_url: profile.avatar_url,
                language: profile.language
              }
            } : {
              id: message.sender_id,
              profiles: undefined
            }
          } as Message;
        });
      } catch (error) {
        console.error('Error in messages query:', error);
        toast.error('Failed to load messages. Please try again.');
        throw error;
      }
    },
    retry: 1,
  });
}
