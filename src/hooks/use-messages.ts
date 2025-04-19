import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message & { viewer_id?: string | null };
  old: Message;
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!userId || !conversationId) {
      console.log('Skipping realtime setup - missing userId or conversationId');
      return;
    }

    console.log('Setting up realtime subscription for conversation:', conversationId);
    
    const channel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePayload) => {
          console.log('Realtime event received:', payload);
          
          const shouldProcess = 
            payload.new?.sender_id !== null || 
            (payload.new?.sender_id === null && payload.new?.viewer_id === userId);

          if (!shouldProcess) {
            console.log('Skipping message due to privacy rules');
            return;
          }
          
          if (payload.eventType === 'DELETE') {
            console.log('Processing delete event for message:', payload.old.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              if (!oldData) return [];
              return oldData.filter(message => message.id !== payload.old.id);
            });
          } else if (payload.eventType === 'INSERT') {
            console.log('Processing insert event for message:', payload.new.id);
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
              return oldData ? [...oldData, payload.new as Message] : [payload.new as Message];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages');
        } else if (status === 'CLOSED') {
          console.log('Subscription closed');
          toast.error('Lost connection to chat. Please refresh.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error');
          toast.error('Error connecting to chat');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, userId]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!userId || !conversationId) {
        console.log('Skipping query - missing userId or conversationId');
        return [];
      }

      try {
        console.log('Fetching messages for conversation:', conversationId);
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .or(`sender_id.neq.null,and(sender_id.is.null,viewer_id.eq.${userId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Failed to load messages');
          throw error;
        }

        const messagesWithSender = await Promise.all(
          (messages || []).map(async (message) => {
            if (!message.sender_id) {
              return message as Message;
            }

            try {
              const { data: senderData, error: senderError } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, language')
                .eq('id', message.sender_id)
                .maybeSingle();

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
                  profiles: senderData ? {
                    first_name: senderData.first_name,
                    last_name: senderData.last_name,
                    avatar_url: senderData.avatar_url,
                    language: senderData.language
                  } : undefined
                }
              } as Message;
            } catch (error) {
              console.error(`Error fetching sender for message ${message.id}:`, error);
              return message as Message;
            }
          })
        );

        console.log('Successfully fetched messages:', messagesWithSender.length);
        return messagesWithSender;
      } catch (error) {
        console.error('Error in query function:', error);
        toast.error('Failed to load messages');
        throw error;
      }
    },
    enabled: !!userId && !!conversationId,
    staleTime: 1000 * 60 * 5,
  });
}
