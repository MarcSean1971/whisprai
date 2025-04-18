
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  contact: {
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    };
  };
}

export function ConnectionsList() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, get the contact connections
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id, contact_id')
        .eq('user_id', user.id);

      if (contactsError) throw contactsError;
      if (!contactsData || contactsData.length === 0) return [];

      // For each contact, fetch their profile information
      const contactsWithProfiles = await Promise.all(
        contactsData.map(async (contact) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', contact.contact_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            return {
              id: contact.id,
              contact: {
                profile: {
                  first_name: null,
                  last_name: null,
                  avatar_url: null
                }
              }
            };
          }

          return {
            id: contact.id,
            contact: {
              profile: profileData
            }
          };
        })
      );

      return contactsWithProfiles as Contact[];
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <div className="space-y-2">
      {contacts?.map((contact) => (
        <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={contact.contact.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {contact.contact.profile?.first_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {contact.contact.profile?.first_name
                  ? `${contact.contact.profile.first_name} ${contact.contact.profile.last_name || ''}`
                  : 'User'}
              </div>
            </div>
          </div>
        </div>
      ))}
      {(!contacts || contacts.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No contacts yet
        </div>
      )}
    </div>
  );
}
