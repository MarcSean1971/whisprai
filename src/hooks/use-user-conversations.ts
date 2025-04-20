
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

        // Get all conversations the user participates in
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants!inner (
              user_id,
              profiles!inner (
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

        // Process conversations to get participants' info
        const processedConversations = await Promise.all(conversations.map(async (conversation) => {
          // Get ALL participants for this conversation
          const { data: allParticipants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles (
                id,
                first_name,
                last_name,
                avatar_url,
                language
              )
            `)
            .eq('conversation_id', conversation.id);

          if (participantsError) {
            console.error('Error fetching all participants:', participantsError);
            throw participantsError;
          }

          // Filter out current user from participants list for display purposes
          const otherParticipants = allParticipants.filter(p => p.user_id !== user.id);
          console.log(`Conversation ${conversation.id} - other participants:`, otherParticipants);

          // For group chats, we might want to show all participants
          // For direct chats, we usually show just the other person
          const primaryParticipant = otherParticipants[0]?.profiles;
          
          // Fixed the error by removing the reference to conversation.name and using a default name instead
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
        }));

        console.log('Processed conversations:', processedConversations);
        return processedConversations;
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        toast.error(error instanceof Error ? error.message : "Failed to load conversations");
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000 // 30 seconds
  });
}
