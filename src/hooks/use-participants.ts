
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useParticipants(conversationId: string) {
  return useQuery({
    queryKey: ["participants", conversationId],
    queryFn: async () => {
      try {
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('profiles:user_id(id, first_name, last_name, avatar_url, tagline)')
          .eq('conversation_id', conversationId)
          .neq('user_id', (await supabase.auth.getUser()).data.user?.id);
        
        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          throw participantsError;
        }

        const profiles = participantsData?.map(p => p.profiles).filter(Boolean) || [];
        return profiles;
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
