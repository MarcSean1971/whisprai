
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch contacts where the current user is the user_id
      const { data, error } = await supabase
        .from('contacts')
        .select('id, contact_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      // If we have contacts, fetch their profile information
      if (data && data.length > 0) {
        const contactIds = data.map(contact => contact.contact_id);
        
        // Get the profiles for the contact_ids
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, tagline, bio')
          .in('id', contactIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        // Combine contact data with profile data
        const contactsWithProfiles = data.map(contact => {
          const profile = profilesData.find(p => p.id === contact.contact_id);
          return {
            ...contact,
            contact_profile: profile || null
          };
        });
        
        console.log('Fetched contacts with profiles:', contactsWithProfiles);
        return contactsWithProfiles;
      }

      console.log('Fetched contacts:', data);
      return data || [];
    },
  });
}
