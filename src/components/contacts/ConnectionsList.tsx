
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserRound } from "lucide-react";
import { ContactProfileDialog } from "./ContactProfileDialog";
import { useState } from "react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  birthdate: string | null;
}

interface Contact {
  id: string;
  contact: {
    id: string;
    email: string;
    profile: Profile | null;
  };
}

export function ConnectionsList() {
  const [selectedContact, setSelectedContact] = useState<Contact['contact'] | null>(null);
  
  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get contacts where user is either user_id or contact_id
      const { data: asUser, error: userError } = await supabase
        .from('contacts')
        .select('id, contact_id')
        .eq('user_id', user.id);

      const { data: asContact, error: contactError } = await supabase
        .from('contacts')
        .select('id, user_id')
        .eq('contact_id', user.id);

      if (userError) throw userError;
      if (contactError) throw contactError;

      // Combine and process both sets of contacts
      const allContacts = [
        ...(asUser || []).map(contact => ({
          id: contact.id,
          otherId: contact.contact_id
        })),
        ...(asContact || []).map(contact => ({
          id: contact.id,
          otherId: contact.user_id
        }))
      ];

      // Fetch details for all contacts
      const contactsWithDetails = await Promise.all(
        allContacts.map(async (contact) => {
          // Fetch email using RPC
          const { data: email } = await supabase
            .rpc('get_user_email', { user_id: contact.otherId });
          
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, bio, tagline, birthdate')
            .eq('id', contact.otherId)
            .maybeSingle();
            
          return {
            id: contact.id,
            contact: {
              id: contact.otherId,
              email: email || 'Unknown email',
              profile: profileData || null
            }
          };
        })
      );

      return contactsWithDetails;
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading contacts...</div>;
  }
  
  if (error) {
    console.error('Error loading contacts:', error);
    return <div className="p-4 text-red-500">Error loading contacts. Please try again later.</div>;
  }

  return (
    <div className="space-y-2">
      {contacts?.map((contact) => (
        <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={contact.contact.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {contact.contact.profile?.first_name?.[0] || contact.contact.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {contact.contact.profile?.first_name
                  ? `${contact.contact.profile.first_name} ${contact.contact.profile.last_name || ''}`
                  : contact.contact.email}
              </div>
              {contact.contact.profile?.tagline && (
                <div className="text-sm text-muted-foreground">
                  {contact.contact.profile.tagline}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedContact(contact.contact)}
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
        onOpenChange={(open) => !open && setSelectedContact(null)}
        contact={selectedContact || undefined}
      />
    </div>
  );
}
