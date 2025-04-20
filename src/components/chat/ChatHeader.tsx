
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ChatParticipantDialog } from "./ChatParticipantDialog";
import { AvatarStack } from "@/components/ui/avatar-stack";

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const otherParticipants = conversation?.participants?.filter(p => 
    profile && p.id !== profile.id
  ) || [];

  const participants = otherParticipants.map(p => ({
    src: p.avatar_url || '',
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    onClick: () => handleParticipantClick(p)
  }));

  // Format participant names and taglines for display
  const participantDetails = otherParticipants.map(p => ({
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    tagline: p.tagline || ''
  }));

  const handleParticipantClick = (participant: any) => {
    setSelectedParticipant(participant);
    setShowProfile(true);
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <BackButton to="/chats" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <AvatarStack 
                avatars={participants} 
                limit={3} 
                size="lg"
              />
              <div className="flex flex-col">
                <span className="font-semibold">
                  {participantDetails.map(p => p.name).join(', ')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {participantDetails.map(p => p.tagline).filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] h-9"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-9 w-9"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          {replyToMessageId && onCancelReply && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancelReply}
            >
              Cancel Reply
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Support
              </DropdownMenuItem>
              <DropdownMenuItem>
                License
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
