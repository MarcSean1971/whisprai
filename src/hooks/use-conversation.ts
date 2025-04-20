
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
}

export function useConversation(conversationId: string) {
  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<Conversation | null> => {
      if (!conversationId) {
        return null;
      }
      
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('id, created_at, updated_at')
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('Error fetching conversation:', conversationError);
        throw conversationError;
      }

      if (!conversationData) {
        return null;
      }

      // Get participants with their profile information
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      // Format participants data
      const formattedParticipants = participantsData?.map(p => ({
        id: p.profiles.id,
        first_name: p.profiles.first_name,
        last_name: p.profiles.last_name,
        email: p.profiles.email,
        avatar_url: p.profiles.avatar_url
      })) || [];

      return {
        id: conversationData.id,
        created_at: conversationData.created_at,
        updated_at: conversationData.updated_at,
        participants: formattedParticipants
      };
    }
  });

  return {
    conversation,
    isLoading,
    error
  };
}
