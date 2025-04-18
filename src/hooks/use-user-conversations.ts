
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

        // Fetch conversations where user is a participant
        const { data: userConversations, error: conversationsError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation:conversations (
              id,
              is_group,
              created_at,
              updated_at
            ),
            user:profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              language
            )
          `)
          .eq('user_id', user.id);

        if (conversationsError) throw conversationsError;
        if (!userConversations) return [];

        // Process conversations
        const processedConversations: Conversation[] = userConversations
          .filter(uc => uc.conversation) // Filter out any null conversations
          .map(uc => {
            const conversation = uc.conversation;
            return {
              ...conversation,
              participants: [{
                user_id: uc.user.id,
                profile: uc.user
              }],
              name: uc.user.first_name 
                ? `${uc.user.first_name} ${uc.user.last_name || ''}`
                : `User ${uc.user.id.slice(0, 8)}`,
              avatar: uc.user.avatar_url
            };
          });

        // Sort conversations by updated_at
        return processedConversations.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

      } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
}
