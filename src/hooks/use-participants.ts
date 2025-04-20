
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useParticipants(conversationId: string) {
  return useQuery({
    queryKey: ["participants", conversationId],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Not authenticated');

        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              tagline
            )
          `)
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id);
        
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
