
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Participant, Profile } from "@/types/conversation";

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function getUserConversationIds(userId: string) {
  const { data: participations, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching participations:', error);
    throw error;
  }

  return participations?.map(p => p.conversation_id) || [];
}

export async function fetchConversationsWithMessages(conversationIds: string[]) {
  const { data: conversations, error } = await supabase
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

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return conversations;
}

export async function fetchConversationParticipants(conversationId: string) {
  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);
    
  if (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
  
  return participants;
}

export async function fetchUserProfiles(userIds: string[]) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
    
  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
  
  return profiles as Profile[];
}

export function processParticipants(
  participants: { user_id: string }[], 
  profiles: Profile[], 
  currentUserId: string
): Participant[] {
  const otherParticipants = participants.filter(p => p.user_id !== currentUserId);
  
  return otherParticipants.map(p => ({
    user_id: p.user_id,
    profile: profiles.find(prof => prof.id === p.user_id)
  }));
}
