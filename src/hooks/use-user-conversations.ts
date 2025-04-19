
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');

        console.log('Fetching conversations for user:', user.id);
        
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants!left (
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
          .eq('conversation_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        console.log('Successfully fetched conversations:', conversations?.length || 0);

        return conversations.map(conversation => {
          const participants = conversation.conversation_participants
            .filter(p => p.user_id !== user.id && p.profiles)
            .map(p => ({
              user_id: p.user_id,
              profile: {
                id: p.profiles?.id || p.user_id,
                first_name: p.profiles?.first_name || null,
                last_name: p.profiles?.last_name || null,
                avatar_url: p.profiles?.avatar_url || null
              }
            }));

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
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        throw error;
      }
    },
    retry: 1
  });
}
