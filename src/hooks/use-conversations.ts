
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get contacts with profile information in a single query
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id,
          profiles!contact_id(
            id,
            first_name,
            last_name,
            avatar_url,
            tagline,
            bio
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const transformedData = data.map(contact => ({
        id: contact.id,
        contact_id: contact.contact_id,
        contact_profile: contact.profiles || null
      }));

      console.log('Fetched contacts:', transformedData);
      return transformedData;
    },
  });
}
