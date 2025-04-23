import { BackButton } from "@/components/ui/back-button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useUserPresence } from "@/hooks/use-user-presence";
import { useState } from "react";
import { ChatParticipantDialog } from "./ChatParticipantDialog";
import { ChatHeaderActions } from "./header/ChatHeaderActions";
import { ChatParticipantsInfo } from "./header/ChatParticipantsInfo";

interface ChatHeaderProps {
  conversationId: string;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
}

export function ChatHeader({ 
  conversationId,
  replyToMessageId,
  onCancelReply
}: ChatHeaderProps) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  const otherParticipants = conversation?.participants?.filter(p => 
    profile && p.id !== profile.id
  ) || [];
  
  const recipient = otherParticipants[0];
  const { isOnline } = useUserPresence(recipient?.id);

  const handleParticipantClick = (participant: any) => {
    setSelectedParticipant(participant);
    setShowProfile(true);
  };

  return (
    <div
      className={`
        bg-background border-b
        sticky top-0 z-20
        md:sticky md:top-0
        md:relative md:z-10
      `}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <BackButton to="/chats" />
          <ChatParticipantsInfo 
            participants={otherParticipants}
            onParticipantClick={handleParticipantClick}
            isOnline={isOnline}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ChatHeaderActions />
        </div>
      </div>
      
      {selectedParticipant && (
        <ChatParticipantDialog 
          open={showProfile}
          onOpenChange={setShowProfile}
          participant={selectedParticipant}
        />
      )}
    </div>
  );
}
