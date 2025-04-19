
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useParticipants(conversationId: string) {
  return useQuery({
    queryKey: ["participants", conversationId],
    queryFn: async () => {
      // Get participants for this conversation
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);
      
      if (participantsError) {
        throw new Error(`Error fetching participants: ${participantsError.message}`);
      }
      
      if (!participantsData || participantsData.length === 0) {
        return [];
      }
      
      // Get profile information for each participant
      const userIds = participantsData.map(p => p.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) {
        throw new Error(`Error fetching profiles: ${profilesError.message}`);
      }
      
      return profilesData || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
