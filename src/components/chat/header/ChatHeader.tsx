
import { ChatHeaderActions } from "./ChatHeaderActions";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useUserPresence } from "@/hooks/use-user-presence";

interface ChatHeaderProps {
  participantId: string | null;
  participantName?: string | null;
  participantAvatarUrl?: string | null;
}

export function ChatHeader({
  participantId,
  participantName = "User",
  participantAvatarUrl
}: ChatHeaderProps) {
  const { isOnline } = useUserPresence(participantId);
  
  return (
    <div className="flex justify-between items-center border-b px-4 h-14">
      <div className="flex items-center gap-3">
        <UserAvatar 
          userId={participantId} 
          name={participantName || "User"} 
          avatarUrl={participantAvatarUrl} 
          size="md" 
          showStatus 
          isOnline={isOnline}
        />
        <div>
          <div className="font-medium">
            {participantName || "Unknown User"}
          </div>
          <div className="text-xs text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>
      
      <ChatHeaderActions />
    </div>
  );
}
