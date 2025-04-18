
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Each contact has a contact_id field that points to a user
      // We need to fetch the profile for that user
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id,
          profiles:profiles(
            id,
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
      
      // The correct solution is to make a second query to get profiles
      // based on the contact_id values from the first query
      if (data && data.length > 0) {
        // Extract all contact_ids
        const contactIds = data.map(contact => contact.contact_id);
        
        // Fetch profiles for these contacts
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', contactIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        // Map profiles to their respective contacts
        const contactsWithProfiles = data.map(contact => {
          const profile = profilesData.find(p => p.id === contact.contact_id);
          return {
            ...contact,
            profiles: profile ? [profile] : []
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
