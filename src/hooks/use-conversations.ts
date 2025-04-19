
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactWithProfile } from "./use-contacts";

export function useConversations() {
  return useQuery({
    queryKey: ['all-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use a simpler query first to get contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, contact_id, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }

      // Then get profile data for each contact
      const contactsWithProfiles = await Promise.all(
        contacts.map(async (contact) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, tagline, bio, birthdate')
            .eq('id', contact.contact_id)
            .single();

          if (profileError) {
            console.warn(`Error fetching profile for contact ${contact.contact_id}:`, profileError);
            return {
              ...contact,
              contact_profile: null
            };
          }

          return {
            ...contact,
            contact_profile: profileData
          };
        })
      );

      return contactsWithProfiles as ContactWithProfile[];
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
}
