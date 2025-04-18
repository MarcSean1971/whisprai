
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  language: string;
}

interface Participant {
  user_id: string;
  profile?: Profile;
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
      
      // With RLS in place, this will automatically filter to only conversations where the user is a participant
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          is_group,
          created_at,
          updated_at,
          conversation_participants(user_id)
        `)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      if (!conversations || conversations.length === 0) {
        console.log('No conversations found for user');
        return [];
      }

      console.log('Found conversations:', conversations.length);

      // Fetch all participant profiles in a single query
      const allParticipantIds = conversations.flatMap(conv => 
        conv.conversation_participants.map((p: any) => p.user_id)
      );

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, language')
        .in('id', allParticipantIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Process conversations with profiles
      const processedConversations: Conversation[] = await Promise.all(
        conversations.map(async (conversation: any) => {
          // Map profiles to participants
          const enrichedParticipants = conversation.conversation_participants.map((p: any) => ({
            user_id: p.user_id,
            profile: profiles?.find(profile => profile.id === p.user_id)
          }));

          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Filter out current user to get other participants
          const otherParticipants = enrichedParticipants.filter(
            p => p.user_id !== user.id
          );

          // Set conversation name and avatar
          let conversationName = 'Conversation';
          let avatar = null;
          
          if (!conversation.is_group && otherParticipants.length > 0) {
            const otherUser = otherParticipants[0].profile;
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
