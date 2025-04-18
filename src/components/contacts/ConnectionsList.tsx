
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
  
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      console.log('Fetching contacts...');
      
      // First get the list of contacts with their contact_id
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_id
        `);

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      
      console.log('Fetched contact IDs:', data);
      
      // If no contacts, return an empty array
      if (!data || data.length === 0) {
        return [];
      }
      
      // Now for each contact_id, get the user details and profile
      const contactsWithDetails = await Promise.all(
        data.map(async (contact) => {
          // Get user email
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_email', { user_id: contact.contact_id });
            
          if (userError) {
            console.error('Error fetching user email:', userError);
          }
          
          // Get profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', contact.contact_id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          return {
            id: contact.id,
            contact: {
              id: contact.contact_id,
              email: userData || 'Unknown email',
              profile: profileData || null
            }
          };
        })
      );
      
      console.log('Processed contacts with details:', contactsWithDetails);
      return contactsWithDetails as Contact[];
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <>
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
      </div>

      <ContactProfileDialog
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
        contact={selectedContact || undefined}
      />
    </>
  );
}
