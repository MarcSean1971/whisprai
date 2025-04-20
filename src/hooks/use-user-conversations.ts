
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

        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants!inner (
              user_id,
              profiles!inner (
                first_name,
                last_name,
                avatar_url
              )
            ),
            messages (
              id,
              content,
              created_at,
              sender_id
            )
          `)
          .eq('conversation_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        return conversations.map(conversation => {
          const otherParticipant = conversation.conversation_participants
            .find(p => p.user_id !== user.id);

          const otherProfile = otherParticipant?.profiles;
          
          const displayName = conversation.is_group 
            ? `Group Chat (${conversation.conversation_participants.length} participants)`
            : `${otherProfile?.first_name || ''} ${otherProfile?.last_name || ''}`.trim() || 'Unknown User';

          const sortedMessages = conversation.messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMessage = sortedMessages[0];

          return {
            id: conversation.id,
            name: displayName,
            is_group: conversation.is_group,
            avatar: !conversation.is_group ? otherProfile?.avatar_url : null,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              conversation_id: conversation.id,
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
