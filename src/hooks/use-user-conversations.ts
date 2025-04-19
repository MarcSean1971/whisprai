
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUserConversations() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');

        console.log('Fetching conversations for user:', user.id);
        
        // Get conversation IDs directly from the database using RPC function
        const { data: conversationIds, error: conversationIdsError } = await supabase
          .rpc('get_user_conversation_ids', { user_uuid: user.id });

        if (conversationIdsError) {
          console.error('Error fetching conversation IDs:', conversationIdsError);
          throw conversationIdsError;
        }

        // Handle null or empty array case
        if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
          console.log('No conversations found for user');
          return [];
        }
        
        // Fetch conversations using the IDs - conversationIds is now an array of UUIDs
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('*, created_at, updated_at, is_group')
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        // For each conversation, get the participants and newest message
        const conversationsWithDetails = await Promise.all(conversations.map(async (conversation) => {
          // Get all participants for this conversation
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles!inner (
                id, 
                first_name,
                last_name,
                avatar_url,
                language
              )
            `)
            .eq('conversation_id', conversation.id);

          if (participantsError) {
            console.error(`Error fetching participants for conversation ${conversation.id}:`, participantsError);
            return null;
          }

          // Get latest message for this conversation
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('id, content, sender_id, created_at, status')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (messagesError) {
            console.error(`Error fetching messages for conversation ${conversation.id}:`, messagesError);
            return null;
          }

          const lastMessage = messages && messages.length > 0 ? messages[0] : undefined;
          
          // Filter out current user from participants list
          const otherParticipants = participants
            ?.filter(p => p.user_id !== user.id)
            ?.map(p => ({
              user_id: p.user_id,
              profile: {
                id: p.profiles?.id || p.user_id,
                first_name: p.profiles?.first_name || null,
                last_name: p.profiles?.last_name || null,
                avatar_url: p.profiles?.avatar_url || null,
                language: p.profiles?.language || 'en' // Add language property with fallback to 'en'
              }
            })) || [];

          const primaryProfile = otherParticipants[0]?.profile;
          
          const displayName = primaryProfile 
            ? (primaryProfile.first_name 
                ? `${primaryProfile.first_name || ''} ${primaryProfile.last_name || ''}`.trim()
                : `User ${primaryProfile.id.slice(0, 8)}`)
            : 'Unknown User';

          return {
            ...conversation,
            participants: otherParticipants,
            lastMessage,
            name: displayName,
            avatar: primaryProfile?.avatar_url || null
          };
        }));

        // Filter out any null results from errors in the Promise.all
        const validConversations = conversationsWithDetails.filter(conv => conv !== null) as Conversation[];
        
        console.log('Successfully fetched conversations:', validConversations.length);
        return validConversations;
      } catch (error) {
        console.error('Error in useUserConversations:', error);
        toast({
          title: "Error loading conversations",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30 seconds
  });
}
