
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Conversation } from "@/types/conversation";
import {
  getCurrentUser,
  getUserConversationIds,
  fetchConversationsWithMessages,
  fetchConversationParticipants,
  fetchUserProfiles,
  processParticipants
} from "@/services/conversation-service";

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        // Get current user
        const user = await getCurrentUser();
        console.log('Fetching conversations for user:', user.id);

        // Get conversation IDs
        const conversationIds = await getUserConversationIds(user.id);
        if (conversationIds.length === 0) {
          console.log('No conversations found');
          return [];
        }
        console.log('Found', conversationIds.length, 'conversations');

        // Fetch conversations with messages
        const conversations = await fetchConversationsWithMessages(conversationIds);

        // Process each conversation
        const processedConversations: Conversation[] = [];
        
        for (const conversation of conversations) {
          // Get participants
          const participants = await fetchConversationParticipants(conversation.id);
          
          // Get other participants' profiles
          const otherParticipants = participants.filter(p => p.user_id !== user.id);
          if (otherParticipants.length === 0) continue;
          
          const otherParticipantIds = otherParticipants.map(p => p.user_id);
          const profiles = await fetchUserProfiles(otherParticipantIds);
          
          // Process participants with profiles
          const processedParticipants = processParticipants(participants, profiles, user.id);
          
          // Get primary profile and format conversation
          const primaryProfile = profiles[0];
          const lastMessage = conversation.messages?.[0];
          
          processedConversations.push({
            ...conversation,
            participants: processedParticipants,
            lastMessage,
            name: primaryProfile?.first_name 
              ? `${primaryProfile.first_name || ''} ${primaryProfile.last_name || ''}`.trim()
              : `User ${primaryProfile?.id.slice(0, 8)}`,
            avatar: primaryProfile?.avatar_url || null
          });
        }

        return processedConversations;
        
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
}
