
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { Search, Loader2, Phone, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ChatParticipantDialog } from "./ChatParticipantDialog";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { useUserPresence } from "@/hooks/use-user-presence";
import { toast } from "sonner";
import { useActiveCalls } from "@/hooks/use-active-calls";

interface Participant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  bio: string | null;
  birthdate: string | null;
  email: string | null;
}

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
  const { createCall, outgoingCall, isLoading: isCallLoading } = useActiveCalls();
  const [callAttempted, setCallAttempted] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);

  const otherParticipants = conversation?.participants?.filter(p => 
    profile && p.id !== profile.id
  ) || [];

  const participants = otherParticipants.map(p => ({
    src: p.avatar_url || '',
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    onClick: () => handleParticipantClick(p)
  }));

  const participantDetails = otherParticipants.map(p => ({
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    tagline: p.tagline || ''
  }));

  const handleParticipantClick = (participant: any) => {
    setSelectedParticipant(participant);
    setShowProfile(true);
  };

  const recipient = otherParticipants[0];
  const { isOnline } = useUserPresence(recipient?.id);
  
  useEffect(() => {
    if (outgoingCall) {
      console.debug("[ChatHeader][DEBUG] Outgoing call object changed:", outgoingCall);
    }
  }, [outgoingCall]);

  useEffect(() => {
    if (callAttempted && !outgoingCall) {
      const timer = setTimeout(() => {
        toast.error("Call could not be started. Please try again.");
        setCallAttempted(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (outgoingCall?.status === "pending") {
      setCallAttempted(false);
    }
  }, [callAttempted, outgoingCall]);

  const handleCallClick = async (callType: 'vonage' | 'p2p' = 'vonage') => {
    if (!recipient) {
      toast.error("No recipient found for this conversation");
      return;
    }
    if (outgoingCall) {
      toast.info("You already have an active call");
      return;
    }
    if (!isOnline) {
      toast.error(`${recipient.first_name || recipient.last_name ? `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() : "Recipient"} appears to be offline`);
      return;
    }
    setCallAttempted(true);
    const result = await createCall(conversationId, recipient.id, callType);
    if (!result) {
      setCallAttempted(false);
      toast.error("Failed to initiate call");
    } else {
      toast.success(`Starting ${callType === 'p2p' ? 'direct' : 'Vonage'} call...`);
    }
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
          {recipient && (
            <>
              <DropdownMenu open={showCallOptions} onOpenChange={setShowCallOptions}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-9 w-9 ${isOnline ? 'bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-500' : ''}`}
                    disabled={isCallLoading || !!outgoingCall}
                    title={`Call ${recipient.first_name || recipient.last_name ? `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() : "participant"}`}
                  >
                    {isCallLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                    <span className="sr-only">Call</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCallClick('vonage')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Vonage Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCallClick('p2p')}>
                    <Video className="h-4 w-4 mr-2" />
                    Direct P2P Call
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
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
