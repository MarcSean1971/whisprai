
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
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

      if (error) throw error;
      return data;
    },
  });
}
