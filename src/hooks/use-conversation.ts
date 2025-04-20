
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  bio: string | null;
  birthdate: string | null;
  email: string | null;
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

      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id
        `)
        .eq('conversation_id', conversationId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      const userIds = participantsData.map(p => p.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, tagline, bio, birthdate')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get emails for each participant
      const emailPromises = userIds.map(async (userId) => {
        const { data, error } = await supabase.rpc('get_user_email', { user_id: userId });
        if (error) {
          console.error('Error fetching user email:', error);
          return null;
        }
        return { userId, email: data };
      });

      const emailResults = await Promise.all(emailPromises);
      const emailMap = new Map(emailResults.map(result => [result?.userId, result?.email]));

      // Combine profile data with emails
      const formattedParticipants = (profilesData || []).map(profile => ({
        ...profile,
        email: emailMap.get(profile.id) || null
      }));

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
