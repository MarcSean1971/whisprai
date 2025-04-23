
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Video } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { VideoCallDialog } from "./VideoCallDialog";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { VideoCallInviteDialog } from "./VideoCallInviteDialog";
import { toast } from "sonner";

export function ChatHeaderActions() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  const { conversation } = useConversation(
    // Assume conversationId is passed down or get from props/context
    (window.location.pathname.match(/[0-9a-fA-F-]{36,}/)?.[0] ?? "") // fallback parse URL
  );
  const { profile } = useProfile();

  // Get recipient id (other than self)
  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find(p => p.id !== profile.id);
  }, [conversation, profile]);

  // Unique room id for this video call
  // Using convoId + user ids to cover 1:1 nicely
  const roomId = useMemo(() => {
    const convoId = conversation?.id ?? "whispr123";
    if (profile && recipient) {
      return `${convoId.substr(0, 8)}_${profile.id.substr(0, 8)}_${recipient.id.substr(0, 8)}`;
    }
    return convoId;
  }, [conversation, profile, recipient]);

  // Video call invitation logic
  const {
    invitation,
    sendInvitation,
    respondInvitation,
    loading: inviteLoading,
    clear
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  // Initiate a call: send an invite to recipient and open dialog for self
  const handleStartCall = async () => {
    if (!recipient?.id) {
      toast.error("No recipient found for call");
      return;
    }
    try {
      await sendInvitation(recipient.id, roomId);
      setShowVideoCall(true);
      setPendingRoomId(roomId);
    } catch (err) {
      toast.error("Failed to send video call invitation");
    }
  };

  // Accept/reject a received invite
  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    await respondInvitation(invitation.id, accept);
    if (accept) {
      setShowVideoCall(true);
      setPendingRoomId(invitation.room_id);
    } else {
      toast.info("Video call invitation rejected");
      clear();
      setShowVideoCall(false);
      setPendingRoomId(null);
    }
  };

  // When closing the VideoCallDialog, reset pendingRoomId
  const handleCloseCallDialog = (open: boolean) => {
    setShowVideoCall(open);
    if (!open) setPendingRoomId(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={handleStartCall}
        title="Start Video Call"
        disabled={inviteLoading}
      >
        <Video className="h-5 w-5" />
      </Button>

      {/* Call dialog: show with right room for initiator or on accept */}
      <VideoCallDialog
        open={showVideoCall}
        onOpenChange={handleCloseCallDialog}
        roomId={pendingRoomId || roomId}
      />

      {/* Recipient get a popup when there's an incoming invitation */}
      {invitation && invitation.status === 'pending' && (
        <VideoCallInviteDialog
          open={true}
          onRespond={handleRespondInvite}
          loading={inviteLoading}
          inviterName={
            conversation?.participants?.find(p => p.id === invitation.sender_id)?.first_name ||
            "Someone"
          }
        />
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
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem>License</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
