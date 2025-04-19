
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all contacts and their profiles in a single query
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id,
          user_id,
          contact_profile:profiles!contact_id(
            id,
            first_name,
            last_name,
            avatar_url,
            tagline,
            bio,
            birthdate
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      return data;
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
}
