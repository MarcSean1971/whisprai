
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');
      
      console.log('Fetching conversations for user:', user.id);

      // Fetch conversations with participants and messages in a single query
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner (
            user_id,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          ),
          messages (
            id,
            content,
            sender_id,
            created_at,
            status
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      return conversations.map(conversation => {
        // Filter participants to exclude the current user
        const participants = conversation.conversation_participants
          .filter(p => p.user_id !== user.id)
          .map(p => {
            // Ensure profile data is safely handled
            const profileData = p.profiles || null;
            
            const profile = {
              id: profileData?.id ? String(profileData.id) : p.user_id,
              first_name: profileData?.first_name ?? null,
              last_name: profileData?.last_name ?? null,
              avatar_url: profileData?.avatar_url ?? null
            };
            
            return {
              user_id: p.user_id,
              profile
            };
          });

        const lastMessage = conversation.messages?.[0];
        const primaryProfile = participants[0]?.profile;
        
        // Create a safe display name with null checks
        const displayName = primaryProfile 
          ? (primaryProfile.first_name 
              ? `${primaryProfile.first_name || ''} ${primaryProfile.last_name || ''}`.trim()
              : `User ${primaryProfile.id.slice(0, 8) || 'Unknown'}`)
          : 'Unknown User';

        return {
          ...conversation,
          participants,
          lastMessage,
          name: displayName,
          avatar: primaryProfile?.avatar_url || null
        };
      });
    },
    retry: 1,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
