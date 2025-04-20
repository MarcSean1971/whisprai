
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

      const senderIds = messages
        .map(msg => msg.sender_id)
        .filter((id): id is string => id !== null);
      
      // Extract parent sender IDs if any exist
      const parentSenderIds = messages
        .filter(msg => msg.parent && msg.parent.sender_id)
        .map(msg => msg.parent.sender_id);
        
      // Combine all sender IDs for a single query
      const uniqueSenderIds = [...new Set([...senderIds, ...parentSenderIds])];

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

      // Process the messages to have the correct type structure
      const messagesWithProfiles = messages.map(message => {
        let processedMessage: Message = {
          ...message,
          sender: message.sender_id ? {
            id: message.sender_id,
            profiles: profilesMap[message.sender_id] ? {
              first_name: profilesMap[message.sender_id].first_name,
              last_name: profilesMap[message.sender_id].last_name,
              avatar_url: profilesMap[message.sender_id].avatar_url,
              language: profilesMap[message.sender_id].language
            } : undefined
          } : undefined
        };

        // Process parent information separately with proper type checking
        if (message.parent && typeof message.parent === 'object') {
          const parentMessage = message.parent as any;
          const parentSenderId = parentMessage.sender_id;
          
          processedMessage.parent = {
            id: parentMessage.id,
            content: parentMessage.content,
            created_at: parentMessage.created_at,
            sender: parentSenderId ? {
              id: parentSenderId,
              profiles: profilesMap[parentSenderId] ? {
                first_name: profilesMap[parentSenderId].first_name,
                last_name: profilesMap[parentSenderId].last_name,
                avatar_url: profilesMap[parentSenderId].avatar_url,
                language: profilesMap[parentSenderId].language
              } : null
            } : null
          };
        }

        return processedMessage;
      });

      return messagesWithProfiles;
    }
  });
}
