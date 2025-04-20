
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useUserConversations() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        console.log('Starting to fetch user conversations');
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');

        console.log('Fetching conversations for user:', user.id);

        // Get all conversations the user is part of (simpler query that works with RLS)
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        console.log('Successfully fetched conversations:', conversations?.length);
        
        if (!conversations || conversations.length === 0) {
          return [];
        }

        // Fetch all participants for these conversations
        const allConversationIds = conversations.map(c => c.id);
        
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id,
            profiles!inner (
              id, 
              first_name,
              last_name,
              avatar_url,
              language
            )
          `)
          .in('conversation_id', allConversationIds);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          throw participantsError;
        }

        // Fetch all latest messages for these conversations
        const { data: allMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at, status, conversation_id')
          .in('conversation_id', allConversationIds)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }

        // Process all conversations
        const processedConversations = conversations.map(conversation => {
          // Get participants for this conversation
          const conversationParticipants = allParticipants
            ?.filter(p => p.conversation_id === conversation.id && p.user_id !== user.id)
            .map(p => ({
              user_id: p.user_id,
              profile: {
                id: p.profiles?.id || p.user_id,
                first_name: p.profiles?.first_name || null,
                last_name: p.profiles?.last_name || null,
                avatar_url: p.profiles?.avatar_url || null,
                language: p.profiles?.language || 'en'
              }
            })) || [];

          // Get latest message for this conversation
          const latestMessage = allMessages?.find(m => m.conversation_id === conversation.id);
          
          const primaryProfile = conversationParticipants[0]?.profile;
          
          const displayName = primaryProfile 
            ? (primaryProfile.first_name 
                ? `${primaryProfile.first_name || ''} ${primaryProfile.last_name || ''}`.trim()
                : `User ${primaryProfile.id.slice(0, 8)}`)
            : 'Unknown User';
            
          // Format timestamp for display
          let formattedTimestamp;
          if (latestMessage?.created_at) {
            try {
              formattedTimestamp = format(new Date(latestMessage.created_at), 'MMM d');
            } catch (e) {
              console.error('Error formatting date:', e);
              formattedTimestamp = undefined;
            }
          }

          return {
            ...conversation,
            participants: conversationParticipants,
            lastMessage: latestMessage,
            name: displayName,
            avatar: primaryProfile?.avatar_url || null,
            timestamp: formattedTimestamp
          };
        });

        console.log('Successfully processed conversations:', processedConversations.length);
        return processedConversations as Conversation[];
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
