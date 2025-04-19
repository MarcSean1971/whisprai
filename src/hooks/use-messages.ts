
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

    // Subscribe to messages table
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

      // First, fetch messages without the join
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to load messages');
        throw messagesError;
      }

      // Get unique sender IDs (excluding null values)
      const senderIds = messages
        .map(msg => msg.sender_id)
        .filter((id): id is string => id !== null);
      
      const uniqueSenderIds = [...new Set(senderIds)];

      // If there are sender IDs, fetch their profiles
      let profilesMap: Record<string, any> = {};
      
      if (uniqueSenderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, language')
          .in('id', uniqueSenderIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profiles rather than failing completely
        } else if (profiles) {
          // Create a map of profiles by ID for easy lookup
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine messages with sender profiles
      const messagesWithProfiles = messages.map(message => {
        if (!message.sender_id) {
          return message; // Return message as is if no sender_id (AI message)
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

      return messagesWithProfiles as Message[];
    }
  });
}
