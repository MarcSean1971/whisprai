
import { useQuery } from "@tanstack/react-query";
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

        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            id,
            is_group,
            created_at,
            updated_at,
            messages (
              id,
              content,
              created_at,
              sender_id
            ),
            other_participant:conversation_participants!inner (
              profiles!inner (
                first_name,
                last_name,
                avatar_url
              )
            )
          `)
          .eq('conversation_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        return conversations.map(conversation => {
          // Get the profile of the other participant
          const otherParticipantProfile = conversation.other_participant
            .find(p => p.profiles)?.profiles;

          // Sort messages to get the latest one
          const sortedMessages = conversation.messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMessage = sortedMessages[0];

          return {
            id: conversation.id,
            name: otherParticipantProfile 
              ? `${otherParticipantProfile.first_name || ''} ${otherParticipantProfile.last_name || ''}`.trim() 
              : 'Unknown User',
            avatar: otherParticipantProfile?.avatar_url,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender_id: lastMessage.sender_id
            } : null,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          };
        });
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        toast.error(error instanceof Error ? error.message : "Failed to load conversations");
        throw error;
      }
    }
  });
}
