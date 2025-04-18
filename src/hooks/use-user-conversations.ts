
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define types for better type safety
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  language: string;
}

interface Participant {
  user_id: string;
  profiles?: Profile;
}

interface Conversation {
  id: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  lastMessage?: any;
  name?: string;
  avatar?: string | null;
}

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      console.log('Fetching conversations for user:', user.id);

      // Get all conversations where the user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participationsError) {
        console.error('Error fetching participations:', participationsError);
        throw participationsError;
      }

      if (!participations || participations.length === 0) {
        console.log('No conversations found for user');
        return [];
      }

      const conversationIds = participations.map(p => p.conversation_id);
      console.log('Found conversation IDs:', conversationIds);

      // Get conversation details
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          is_group,
          created_at,
          updated_at,
          participants:conversation_participants(user_id)
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      // Now, we'll fetch participant profiles separately to avoid the relation error
      const processedConversations: Conversation[] = await Promise.all(
        conversations.map(async (conversation) => {
          // Get participant profiles
          const participantIds = conversation.participants.map((p: any) => p.user_id);
          
          // Fetch profiles for all participants
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, language')
            .in('id', participantIds);

          if (profilesError) {
            console.error(`Error fetching profiles for conversation ${conversation.id}:`, profilesError);
          }

          // Match profiles to participants
          const enrichedParticipants = conversation.participants.map((p: any) => ({
            user_id: p.user_id,
            profiles: profiles?.find(profile => profile.id === p.user_id)
          }));

          // Get last message
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (messagesError) {
            console.error(`Error fetching messages for conversation ${conversation.id}:`, messagesError);
          }

          // Filter out the current user from participants to get the other participants
          const otherParticipants = enrichedParticipants.filter(
            p => p.user_id !== user.id
          );

          // For direct messages (not groups), use the other person's name as conversation name
          let conversationName = 'Conversation';
          let avatar = null;
          
          if (!conversation.is_group && otherParticipants.length > 0) {
            const otherUser = otherParticipants[0].profiles;
            if (otherUser) {
              conversationName = otherUser.first_name && otherUser.last_name 
                ? `${otherUser.first_name} ${otherUser.last_name}`.trim()
                : `User ${otherUser.id.slice(0, 8)}`;
              avatar = otherUser.avatar_url;
            }
          }

          return {
            ...conversation,
            participants: enrichedParticipants,
            name: conversationName,
            avatar,
            lastMessage: messages && messages.length > 0 ? messages[0] : null,
          };
        })
      );

      return processedConversations;
    },
  });
}
