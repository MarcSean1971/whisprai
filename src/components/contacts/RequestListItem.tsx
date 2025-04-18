
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface RequestListItemProps {
  id: string;
  sender_id: string;
  profile?: Profile;
  isProcessing: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export function RequestListItem({
  id,
  sender_id,
  profile,
  isProcessing,
  onAccept,
  onReject,
}: RequestListItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            {profile?.first_name?.[0] || sender_id[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">
            {profile?.first_name
              ? `${profile.first_name} ${profile.last_name || ''}`
              : sender_id}
          </div>
          <div className="text-sm text-muted-foreground">
            Wants to connect with you
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAccept(id)}
          disabled={isProcessing}
        >
          Accept
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onReject(id)}
          disabled={isProcessing}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
