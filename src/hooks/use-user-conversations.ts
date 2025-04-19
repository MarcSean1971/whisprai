
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error fetching user:', userError);
          throw userError;
        }
        if (!user) throw new Error('Not authenticated');

        console.log('Fetching conversations for user:', user.id);
        
        // First verify we can access the conversation_participants table
        const { data: participantsTest, error: participantsTestError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (participantsTestError) {
          console.error('Error accessing conversation_participants:', participantsTestError);
          throw new Error(`Cannot access conversation participants: ${participantsTestError.message}`);
        }
        
        console.log('Successfully accessed conversation_participants');

        // Now fetch the actual conversations with all data
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
          .eq('conversation_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        console.log('Successfully fetched conversations:', conversations?.length || 0);

        return conversations.map(conversation => {
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
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        throw error;
      }
    },
    retry: 3, // Increase retry attempts
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Enable automatic refetch on window focus
    refetchInterval: 1000 * 60 // Refetch every minute
  });
}
