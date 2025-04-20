
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useParticipants(conversationId: string) {
  return useQuery({
    queryKey: ["participants", conversationId],
    queryFn: async () => {
      try {
        // Get current user
        const { data: currentUser, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Authentication error:", userError);
          throw new Error('Authentication error');
        }
        if (!currentUser.user) throw new Error('Not authenticated');

        // Get participants for this conversation
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', currentUser.user.id); // Exclude current user
        
        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          throw new Error(`Error fetching participants: ${participantsError.message}`);
        }
        
        if (!participantsData || participantsData.length === 0) {
          console.log("No participants found for conversation:", conversationId);
          return [];
        }
        
        // Get profile information for each participant
        const userIds = participantsData.map(p => p.user_id);
        console.log("Fetching profiles for users:", userIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, tagline')
          .in('id', userIds);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }
        
        console.log("Profiles fetched successfully:", profilesData);
        return profilesData || [];
      } catch (error) {
        console.error("Error in useParticipants hook:", error);
        toast.error("Failed to load participants");
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
