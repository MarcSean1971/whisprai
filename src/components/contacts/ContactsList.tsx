
import { useConversations } from "@/hooks/use-conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { ContactProfileDialog } from "./ContactProfileDialog";
import { useState } from "react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
}

interface Contact {
  id: string;
  contact_id: string;
  contact_profiles: Profile[];
}

export function ContactsList() {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { data: contacts, isLoading } = useConversations();

  if (isLoading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <div className="space-y-2">
      {contacts?.map((contact: Contact) => {
        const profile = contact.contact_profiles[0];
        
        return (
          <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Unknown Contact'}
                </div>
                {profile?.tagline && (
                  <div className="text-sm text-muted-foreground">
                    {profile.tagline}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedContact({
                id: contact.contact_id,
                email: "",
                profile: {
                  first_name: profile?.first_name,
                  last_name: profile?.last_name,
                  avatar_url: profile?.avatar_url,
                  bio: profile?.bio,
                  tagline: profile?.tagline,
                  birthdate: null
                }
              })}
            >
              <UserRound className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {(!contacts || contacts.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No contacts yet
        </div>
      )}

      <ContactProfileDialog
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
        contact={selectedContact}
      />
    </div>
  );
}
