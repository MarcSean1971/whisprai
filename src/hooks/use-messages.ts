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

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            profiles (
              first_name,
              last_name,
              avatar_url,
              language
            )
          ),
          parent:parent_id (
            id,
            content,
            created_at,
            sender_id
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

      const parentSenderIds = messages
        .filter(msg => msg.parent?.sender_id)
        .map(msg => msg.parent.sender_id);

      let parentProfilesMap: Record<string, any> = {};
      if (parentSenderIds.length > 0) {
        const { data: parentProfiles, error: parentProfilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, language')
          .in('id', parentSenderIds);

        if (parentProfilesError) {
          console.error('Error fetching parent sender profiles:', parentProfilesError);
        } else if (parentProfiles) {
          parentProfilesMap = parentProfiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return messages.map(message => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        status: message.status,
        original_language: message.original_language,
        metadata: message.metadata,
        private_room: message.private_room,
        private_recipient: message.private_recipient,
        sender: message.sender,
        parent: message.parent ? {
          id: message.parent.id,
          content: message.parent.content,
          created_at: message.parent.created_at,
          sender: message.parent.sender_id ? {
            id: message.parent.sender_id,
            profiles: parentProfilesMap[message.parent.sender_id]
          } : null
        } : null
      }));
    }
  });
}
