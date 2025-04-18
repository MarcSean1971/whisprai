
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, MessageSquare, Tag } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ContactProfileContentProps {
  contact: {
    id: string;
    email: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      tagline: string | null;
      birthdate: string | null;
    } | null;
  };
  isCreating: boolean;
  onStartChat: () => void;
}

export function ContactProfileContent({ contact, isCreating, onStartChat }: ContactProfileContentProps) {
  const fullName = contact.profile?.first_name 
    ? `${contact.profile.first_name} ${contact.profile.last_name || ''}`
    : contact.email;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={contact.profile?.avatar_url || undefined} />
          <AvatarFallback>
            {contact.profile?.first_name?.[0] || contact.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{fullName}</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{contact.email}</span>
        </div>

        {contact.profile?.tagline && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span>{contact.profile.tagline}</span>
          </div>
        )}

        {contact.profile?.birthdate && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(contact.profile.birthdate).toLocaleDateString()}</span>
          </div>
        )}

        {contact.profile?.bio && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">About</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.profile.bio}</p>
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={onStartChat}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating chat...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Chat
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
