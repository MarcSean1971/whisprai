
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');

        // Get conversations the user participates in
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participationsError) throw participationsError;
        
        if (!participations.length) {
          return []; // User has no conversations yet
        }

        // Get the conversation IDs
        const conversationIds = participations.map(p => p.conversation_id);

        // Fetch the conversations
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages (
              id,
              content,
              sender_id,
              created_at,
              status
            )
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Get all participants for these conversations
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url,
              language
            )
          `)
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;

        // Group participants by conversation
        const participantsByConversation = allParticipants.reduce((acc, p) => {
          if (!acc[p.conversation_id]) {
            acc[p.conversation_id] = [];
          }
          acc[p.conversation_id].push({
            user_id: p.user_id,
            profile: p.profiles
          });
          return acc;
        }, {});

        // Process conversations with participants
        const processedConversations: Conversation[] = conversations.map(conv => {
          const participants = participantsByConversation[conv.id] || [];
          
          // Get other participant for 1:1 chats
          const otherParticipant = participants.find(p => p.user_id !== user.id);
          
          // Set conversation name and avatar
          let name, avatar;
          
          if (!conv.is_group && otherParticipant?.profile) {
            name = `${otherParticipant.profile.first_name || ''} ${otherParticipant.profile.last_name || ''}`.trim() || `User ${otherParticipant.user_id.slice(0, 8)}`;
            avatar = otherParticipant.profile.avatar_url;
          } else {
            name = 'Conversation';
            avatar = null;
          }
          
          // Sort messages by date and get the latest
          const messages = conv.messages || [];
          messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const lastMessage = messages.length > 0 ? messages[0] : null;

          return {
            ...conv,
            participants,
            name,
            avatar,
            lastMessage
          };
        });

        return processedConversations;
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        throw error;
      }
    },
    retry: 1,
  });
}
