
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

        // Fetch conversations with participants in a single query using foreign keys
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants!inner (
              user_id,
              profiles:user_id (
                id,
                first_name,
                last_name,
                avatar_url,
                language
              )
            ),
            messages:messages (
              *
            )
          `)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        // Process conversations
        const processedConversations: Conversation[] = conversations.map((conv: any) => {
          const participants = conv.conversation_participants.map((p: any) => ({
            user_id: p.user_id,
            profile: p.profiles
          }));

          // Get other participant for 1:1 chats
          const otherParticipant = participants.find(p => p.user_id !== user.id);

          // Set conversation name and avatar
          const name = !conv.is_group && otherParticipant?.profile
            ? `${otherParticipant.profile.first_name || ''} ${otherParticipant.profile.last_name || ''}`.trim() || `User ${otherParticipant.user_id.slice(0, 8)}`
            : 'Conversation';
          
          const avatar = !conv.is_group && otherParticipant?.profile
            ? otherParticipant.profile.avatar_url
            : null;

          // Get last message
          const lastMessage = conv.messages?.[0];

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
