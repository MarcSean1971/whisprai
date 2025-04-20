
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
            conversation_participants (
              user_id,
              profiles (
                id,
                first_name,
                last_name,
                avatar_url,
                language
              )
            )
          `)
          .eq('conversation_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        if (!conversations || conversations.length === 0) {
          console.log('No conversations found');
          return [];
        }

        console.log('Raw conversations data:', conversations);

        const processedConversations = conversations.map(conversation => {
          // Filter out current user from participants list
          const otherParticipants = conversation.conversation_participants
            .filter(p => p.user_id !== user.id);

          // For group chats or direct chats, show appropriate name
          const primaryParticipant = otherParticipants[0]?.profiles;
          const displayName = conversation.is_group 
            ? 'Group Chat' 
            : primaryParticipant 
              ? `${primaryParticipant.first_name || ''} ${primaryParticipant.last_name || ''}`.trim() || `User ${primaryParticipant.id.slice(0, 8)}`
              : 'Unknown User';
          
          return {
            ...conversation,
            participants: otherParticipants.map(p => ({
              user_id: p.user_id,
              profile: p.profiles
            })),
            name: displayName,
            avatar: primaryParticipant?.avatar_url || null
          };
        });

        console.log('Processed conversations:', processedConversations);
        return processedConversations;
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        toast.error(error instanceof Error ? error.message : "Failed to load conversations");
        throw error;
      }
    },
    staleTime: 30000 // 30 seconds
  });
}
