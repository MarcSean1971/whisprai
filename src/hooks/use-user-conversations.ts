
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  language: string;
}

interface Participant {
  user_id: string;
  profile?: Profile;
}

interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
}

interface Conversation {
  id: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  lastMessage?: LastMessage;
  name?: string;
  avatar?: string | null;
}

export function useUserConversations() {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');
        
        console.log('Fetching conversations for user:', user.id);

        // First, get all conversation IDs the user is part of
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Error fetching participations:', participationsError);
          throw participationsError;
        }

        if (!participations || participations.length === 0) {
          console.log('No conversations found');
          return [];
        }

        const conversationIds = participations.map(p => p.conversation_id);
        console.log('Found', conversationIds.length, 'conversations');

        // Fetch conversations and their latest messages in a single query
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages:messages(
              content,
              created_at,
              sender_id
            )
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        // For each conversation, get all participants
        const processedConversations: Conversation[] = [];
        
        for (const conversation of conversations) {
          // Get participants for this conversation
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversation.id);
            
          if (participantsError) {
            console.error('Error fetching participants:', participantsError);
            continue;
          }
          
          // Get other participants' profiles (excluding current user)
          const otherParticipants = participants.filter(p => p.user_id !== user.id);
          
          if (otherParticipants.length === 0) {
            // Skip conversations with no other participants
            continue;
          }
          
          // Get profiles for other participants
          const otherParticipantIds = otherParticipants.map(p => p.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', otherParticipantIds);
            
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            continue;
          }
          
          // Format participants list with profiles
          const processedParticipants: Participant[] = otherParticipants.map(p => {
            const profile = profiles.find(prof => prof.id === p.user_id);
            return {
              user_id: p.user_id,
              profile: profile as Profile
            };
          });
          
          // Get primary other participant for 1:1 chat (first one for simplicity)
          const primaryProfile = profiles[0];
          
          // Get the last message for this conversation
          const lastMessage = conversation.messages?.[0] as LastMessage | undefined;
          
          // Add processed conversation to the result
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

        // Return the processed conversations
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
