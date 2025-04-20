
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

        console.log("Current user ID:", user.id);

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
              profiles!inner (
                first_name,
                last_name,
                avatar_url
              )
            )
          `)
          .eq('conversation_participants.user_id', user.id);

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        console.log("Raw conversations data:", JSON.stringify(conversations, null, 2));

        return conversations.map(conversation => {
          // Get all participants except the current user
          const otherParticipants = conversation.conversation_participants
            .filter(p => p.user_id !== user.id);
          
          console.log("Processing conversation:", conversation.id);
          console.log("Other participants found:", otherParticipants);

          // Get the other person's profile for 1-on-1 chats
          const otherParticipant = otherParticipants[0];
          console.log("Selected other participant:", otherParticipant);
          
          if (!otherParticipant) {
            console.warn("No other participant found for conversation:", conversation.id);
          }

          // Sort messages by date to get the latest
          const sortedMessages = conversation.messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMessage = sortedMessages[0];

          const otherProfile = otherParticipant?.profiles;
          const name = otherProfile 
            ? `${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`.trim()
            : 'Unknown User';

          console.log("Formatted conversation:", {
            id: conversation.id,
            name,
            avatar: otherProfile?.avatar_url,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
            } : null
          });

          return {
            id: conversation.id,
            name,
            avatar: otherProfile?.avatar_url,
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
