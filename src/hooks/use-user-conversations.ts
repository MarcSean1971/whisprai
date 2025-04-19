
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      // Fetch conversations with participants and messages in a single query
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner (
            user_id,
            profiles (
              id,
              first_name,
              last_name,
              avatar_url
            )
          ),
          messages (
            id,
            content,
            sender_id,
            created_at,
            status
          )
        `)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      return conversations.map(conversation => {
        // Filter participants to exclude the current user
        const participants = conversation.conversation_participants
          .filter(p => p.user_id !== user.id)
          .map(p => {
            const profile = p.profiles;
            return {
              user_id: p.user_id,
              profile: {
                id: profile?.id || p.user_id,
                first_name: profile?.first_name || null,
                last_name: profile?.last_name || null,
                avatar_url: profile?.avatar_url || null
              }
            };
          });

        const lastMessage = conversation.messages?.[0];
        const primaryProfile = participants[0]?.profile;
        
        const displayName = primaryProfile 
          ? (primaryProfile.first_name 
              ? `${primaryProfile.first_name || ''} ${primaryProfile.last_name || ''}`.trim()
              : `User ${primaryProfile.id.slice(0, 8)}`)
          : 'Unknown User';

        return {
          ...conversation,
          participants,
          lastMessage,
          name: displayName,
          avatar: primaryProfile?.avatar_url || null
        };
      });
    }
  });
}
