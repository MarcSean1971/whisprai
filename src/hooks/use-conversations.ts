
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // This will use the RLS policies to only fetch conversations where the user is a participant
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            profiles:user_id(
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
      
      return data;
    },
  });
}
