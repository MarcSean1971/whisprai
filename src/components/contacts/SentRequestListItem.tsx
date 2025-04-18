
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Undo2, UserRound } from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  birthdate: string | null;
}

interface SentRequestListItemProps {
  id: string;
  recipientEmail: string;
  profile: Profile | null;
  isProcessing: boolean;
  onWithdraw: (requestId: string) => Promise<void>;
  onViewProfile: () => void;
}

export function SentRequestListItem({
  id,
  recipientEmail,
  profile,
  isProcessing,
  onWithdraw,
  onViewProfile,
}: SentRequestListItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            {profile?.first_name?.[0] || recipientEmail[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">
            {profile?.first_name
              ? `${profile.first_name} ${profile.last_name || ''}`
              : recipientEmail}
          </div>
          <div className="text-sm text-muted-foreground">
            Request pending
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onViewProfile}
        >
          <UserRound className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWithdraw(id)}
          disabled={isProcessing}
        >
          Withdraw
        </Button>
      </div>
    </div>
  );
}
