
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ContactProfileDialog } from "./ContactProfileDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

interface Contact {
  id: string;
  contact: {
    email: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      tagline: string | null;
      birthdate: string | null;
    };
  };
}

export function ConnectionsList() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

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
            .select('first_name, last_name, avatar_url, bio, tagline, birthdate')
            .eq('id', contact.contact_id)
            .single();

          // Instead of querying auth table directly, we'll use user email from profiles or set a placeholder
          // This approach avoids trying to access the auth table which is restricted
          
          if (profileError) {
            console.error("Error fetching contact details:", profileError);
            return {
              id: contact.id,
              contact: {
                email: 'Unknown',
                profile: {
                  first_name: null,
                  last_name: null,
                  avatar_url: null,
                  bio: null,
                  tagline: null,
                  birthdate: null
                }
              }
            };
          }

          return {
            id: contact.id,
            contact: {
              // Use a placeholder email or fetch it another way if required
              email: `contact-${contact.contact_id}@example.com`,
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedContact(contact)}
          >
            <UserRound className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {(!contacts || contacts.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No contacts yet
        </div>
      )}

      <ContactProfileDialog
        open={!!selectedContact}
        onOpenChange={() => setSelectedContact(null)}
        contact={selectedContact ? {
          id: selectedContact.id,
          email: selectedContact.contact.email,
          profile: selectedContact.contact.profile
        } : undefined}
      />
    </div>
  );
}
