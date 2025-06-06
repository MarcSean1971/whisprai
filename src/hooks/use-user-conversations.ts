
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
            conversation_participants!inner (
              user_id,
              profiles (
                first_name,
                last_name,
                avatar_url
              )
            )
          `)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        return conversations.map(conversation => {
          const sortedMessages = conversation.messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMessage = sortedMessages[0];

          // Filter out current user and get other participants' info
          const otherParticipants = conversation.conversation_participants
            .filter(participant => participant.user_id !== user.id)
            .map(participant => {
              const profile = participant.profiles;
              return {
                name: profile?.first_name || profile?.last_name ? 
                  `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
                  'Unknown User',
                avatar: profile?.avatar_url || null
              };
            });

          return {
            id: conversation.id,
            name: otherParticipants.map(p => p.name).join(', '), // Join other participants' names
            avatar: conversation.is_group ? null : otherParticipants[0]?.avatar || null,
            is_group: conversation.is_group,
            participants: otherParticipants,
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
