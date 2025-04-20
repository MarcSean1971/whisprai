
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
            messages (
              id,
              content,
              created_at,
              sender_id,
              metadata,
              sender:profiles!messages_sender_id_fkey (
                id,
                first_name,
                last_name,
                avatar_url
              )
            ),
            conversation_participants (
              user_id,
              profiles (
                id,
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

        if (!conversations || conversations.length === 0) {
          console.log('No conversations found');
          return [];
        }

        console.log('Raw conversations data:', conversations);

        const processedConversations = conversations.map(conversation => {
          // Get all participants including the current user
          const allParticipants = conversation.conversation_participants || [];
          
          // Filter out current user from participants list for display
          const otherParticipants = allParticipants.filter(p => 
            p.user_id !== user.id && p.profiles
          );

          // Get the latest message
          const messages = conversation.messages || [];
          const lastMessage = messages.length > 0 ? messages[0] : null;

          // For group chats or direct chats, show appropriate name
          const displayName = conversation.is_group 
            ? `Group Chat (${otherParticipants.length + 1} participants)` 
            : otherParticipants[0]?.profiles
              ? `${otherParticipants[0].profiles.first_name || ''} ${otherParticipants[0].profiles.last_name || ''}`.trim()
              : 'Unknown User';

          return {
            ...conversation,
            participants: otherParticipants.map(p => ({
              name: p.profiles ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim() : 'Unknown User',
              avatar: p.profiles?.avatar_url || null
            })),
            name: displayName,
            avatar: !conversation.is_group ? otherParticipants[0]?.profiles?.avatar_url : null,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender: lastMessage.sender,
              metadata: lastMessage.metadata
            } : null
          };
        });

        // Sort conversations by last message date
        processedConversations.sort((a, b) => {
          const dateA = a.lastMessage?.created_at || a.created_at;
          const dateB = b.lastMessage?.created_at || b.created_at;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
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
