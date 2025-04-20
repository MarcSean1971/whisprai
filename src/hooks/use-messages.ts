
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
  metadata?: any;
  private_room?: string | null;
  private_recipient?: string | null;
  sender?: {
    id: string;
    profiles?: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
      language?: string;
    }
  };
  parent?: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      profiles?: {
        first_name?: string | null;
        last_name?: string | null;
        avatar_url?: string | null;
        language?: string;
      } | null;
    } | null;
  } | null;
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) {
      console.warn('No conversation ID provided');
      return;
    }

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
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('No conversation ID provided');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Using simpler join syntax without relying on foreign key constraint names
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            language
          ),
          parent:parent_id(
            id,
            content,
            created_at,
            sender:profiles(
              id,
              first_name,
              last_name,
              avatar_url,
              language
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .or(`private_room.is.null,and(private_room.eq.AI,or(sender_id.eq.${user.id},private_recipient.eq.${user.id}))`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to load messages');
        throw messagesError;
      }

      if (!messages) {
        console.warn('No messages returned from query');
        return [];
      }

      return messages.map(message => {
        if (!message.id || !message.content || !message.created_at || !message.conversation_id) {
          console.error('Invalid message structure:', message);
          return null;
        }

        return {
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          status: message.status || 'sent',
          original_language: message.original_language,
          metadata: message.metadata,
          private_room: message.private_room,
          private_recipient: message.private_recipient,
          sender: message.sender && message.sender[0] ? {
            id: message.sender[0].id,
            profiles: {
              first_name: message.sender[0].first_name,
              last_name: message.sender[0].last_name,
              avatar_url: message.sender[0].avatar_url,
              language: message.sender[0].language
            }
          } : null,
          parent: message.parent ? {
            id: message.parent.id,
            content: message.parent.content,
            created_at: message.parent.created_at,
            sender: message.parent.sender && message.parent.sender[0] ? {
              id: message.parent.sender[0].id,
              profiles: {
                first_name: message.parent.sender[0].first_name,
                last_name: message.parent.sender[0].last_name,
                avatar_url: message.parent.sender[0].avatar_url,
                language: message.parent.sender[0].language
              }
            } : null
          } : null
        };
      }).filter(Boolean);
    }
  });
}
