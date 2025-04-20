
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
                id,
                first_name,
                last_name,
                avatar_url
              )
            ),
            messages (
              id,
              content,
              created_at,
              sender_id,
              sender:profiles!sender_id (
                id,
                first_name,
                last_name
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
          // Get all participants except current user
          const otherParticipants = conversation.conversation_participants
            .filter(p => p.user_id !== user.id)
            .map(p => ({
              id: p.profiles.id,
              name: `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim() || 'Unknown User',
              avatar: p.profiles.avatar_url
            }));

          // Get the most recent message
          const sortedMessages = conversation.messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMessage = sortedMessages[0];

          // For direct chats, use the other participant's name
          // For group chats, show number of participants
          const displayName = conversation.is_group
            ? `Group Chat (${conversation.conversation_participants.length} participants)`
            : otherParticipants[0]?.name || 'Unknown User';

          return {
            id: conversation.id,
            name: displayName,
            is_group: conversation.is_group,
            participants: otherParticipants,
            avatar: !conversation.is_group ? otherParticipants[0]?.avatar : null,
            lastMessage: lastMessage ? {
              content: lastMessage.content.length > 50 
                ? `${lastMessage.content.substring(0, 50)}...` 
                : lastMessage.content,
              created_at: lastMessage.created_at,
              sender_id: lastMessage.sender_id,
              senderName: lastMessage.sender 
                ? `${lastMessage.sender.first_name || ''} ${lastMessage.sender.last_name || ''}`.trim()
                : 'Unknown'
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
