
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all contacts where the current user is the user_id
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id,
          contacts:profiles!contacts_contact_id_fkey (
            first_name,
            last_name,
            avatar_url,
            tagline,
            bio
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      
      console.log('Fetched contacts:', data);
      return data;
    },
  });
}
