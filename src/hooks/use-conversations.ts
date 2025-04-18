
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch contacts with a separate query to get their profiles
      // Only get contacts where the current user is the user_id
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id,
          user_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      // For each contact, fetch the profile information
      const contactsWithProfiles = await Promise.all(
        data.map(async (contact) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', contact.contact_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return {
              id: contact.id,
              contact_id: contact.contact_id,
              contact_profile: null
            };
          }

          return {
            id: contact.id,
            contact_id: contact.contact_id,
            contact_profile: profileData
          };
        })
      );

      console.log('Fetched contacts with profiles:', contactsWithProfiles);
      return contactsWithProfiles;
    },
  });
}
