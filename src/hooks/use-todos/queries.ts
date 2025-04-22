import { supabase } from "@/integrations/supabase/client";
import { EnrichedTodo } from "./types";

export async function fetchTodos(): Promise<EnrichedTodo[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: todosData, error: todosError } = await supabase
    .from('todos')
    .select('*')
    .order('due_date', { ascending: true });

  if (todosError) {
    console.error('Error fetching todos:', todosError);
    throw todosError;
  }

  const conversationIds = [...new Set(todosData.map(todo => todo.conversation_id))];
  const userIds = [
    ...new Set([
      ...todosData.map(todo => todo.assigned_to),
      ...todosData.map(todo => todo.creator_id)
    ])
  ];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  const messageIds = [...new Set(todosData.filter(todo => todo.message_id).map(todo => todo.message_id))];
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('id, content')
    .in('id', messageIds);

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  }

  const profilesMap = (profilesData || []).reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, { id: string; first_name: string | null; last_name: string | null }>);

  const messagesMap = (messagesData || []).reduce((acc, message) => {
    acc[message.id] = message;
    return acc;
  }, {} as Record<string, { id: string; content: string }>);

  const participantsByConversation = (participantsData || []).reduce((acc, participant) => {
    if (!acc[participant.conversation_id]) {
      acc[participant.conversation_id] = [];
    }
    
    if (participant.profiles && 
        typeof participant.profiles === 'object' && 
        participant.user_id !== user.id) {
      const profile = participant.profiles as { 
        id: string; 
        first_name: string | null; 
        last_name: string | null 
      };
      
      acc[participant.conversation_id].push({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name
      });
    }
    
    return acc;
  }, {} as Record<string, Array<{ id: string; first_name: string | null; last_name: string | null }>>);

  return todosData.map(todo => {
    const assigneeProfile = profilesMap[todo.assigned_to] || { first_name: null, last_name: null };
    const creatorProfile = profilesMap[todo.creator_id] || { first_name: null, last_name: null };
    const messageData = todo.message_id ? messagesMap[todo.message_id] : null;
    const conversationParticipants = participantsByConversation[todo.conversation_id] || [];

    return {
      ...todo,
      messages: messageData ? { content: messageData.content } : null,
      profiles: {
        first_name: assigneeProfile.first_name,
        last_name: assigneeProfile.last_name
      },
      creator_profile: {
        first_name: creatorProfile.first_name,
        last_name: creatorProfile.last_name
      },
      conversation_participants: conversationParticipants
    };
  }) as EnrichedTodo[];
}
