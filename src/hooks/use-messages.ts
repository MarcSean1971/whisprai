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
      profiles: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        language: string;
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

  return useQuery<Message[]>({
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
          parent:parent_id (
            id,
            content,
            created_at,
            sender:sender_id (
              id,
              profiles:profiles (
                first_name,
                last_name,
                avatar_url,
                language
              )
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

      const senderIds = messages
        .map(msg => msg.sender_id)
        .filter((id): id is string => id !== null);
      
      const uniqueSenderIds = [...new Set(senderIds)];

      let profilesMap: Record<string, any> = {};
      
      if (uniqueSenderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, language')
          .in('id', uniqueSenderIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      const messagesWithProfiles = messages.map(message => {
        if (!message.sender_id) {
          return message;
        }
        
        const profile = profilesMap[message.sender_id];
        
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
          } : { id: message.sender_id }
        };
      });

      return messagesWithProfiles;
    }
  });
}
