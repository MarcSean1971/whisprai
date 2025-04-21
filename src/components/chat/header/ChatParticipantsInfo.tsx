
import { AvatarStack } from "@/components/ui/avatar-stack";

interface Participant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
}

interface ChatParticipantsInfoProps {
  participants: Participant[];
  onParticipantClick: (participant: Participant) => void;
}

export function ChatParticipantsInfo({ participants, onParticipantClick }: ChatParticipantsInfoProps) {
  const participantAvatars = participants.map(p => ({
    src: p.avatar_url || '',
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    onClick: () => onParticipantClick(p)
  }));

  const participantDetails = participants.map(p => ({
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    tagline: p.tagline || ''
  }));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <AvatarStack 
          avatars={participantAvatars} 
          limit={3} 
          size="lg"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {participantDetails.map(p => p.name).join(', ')}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {participantDetails.map(p => p.tagline).filter(Boolean).join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
}
