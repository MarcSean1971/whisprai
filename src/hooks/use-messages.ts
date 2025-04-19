
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
      try {
        if (!conversationId) {
          throw new Error('No conversation ID provided');
        }

        // Fetch messages with sender profiles
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at, 
            conversation_id,
            sender_id,
            status,
            metadata,
            original_language,
            sender:sender_id(
              id,
              profiles(
                first_name,
                last_name,
                avatar_url,
                language
              )
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Type assertion to ensure the returned data matches our Message interface
        return messages as unknown as Message[];
      } catch (error) {
        console.error('Error in messages query:', error);
        toast.error('Failed to load messages');
        throw error;
      }
    }
  });
}
