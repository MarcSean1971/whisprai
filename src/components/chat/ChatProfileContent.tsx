
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Mail, Tag } from "lucide-react";

interface ChatProfileContentProps {
  participant: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
    bio: string | null;
    birthdate: string | null;
    email: string | null;
  };
}

export function ChatProfileContent({ participant }: ChatProfileContentProps) {
  const fullName = participant.first_name 
    ? `${participant.first_name} ${participant.last_name || ''}`
    : 'Unknown User';

  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={participant.avatar_url || undefined} />
          <AvatarFallback>
            {participant.first_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{fullName}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {participant.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{participant.email}</span>
          </div>
        )}

        {participant.tagline && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span>{participant.tagline}</span>
          </div>
        )}

        {participant.birthdate && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(participant.birthdate).toLocaleDateString()}</span>
          </div>
        )}

        {participant.bio && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">About</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{participant.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
