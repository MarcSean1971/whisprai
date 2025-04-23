
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Video } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useMemo, useRef, useEffect } from "react";
import { VideoCallDialog } from "./VideoCallDialog";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useVideoCallInvitations } from "@/hooks/use-video-call-invitations";
import { VideoCallInviteDialog } from "./VideoCallInviteDialog";
import { VideoCallOutgoingDialog } from "./VideoCallOutgoingDialog";
import { toast } from "sonner";

export function ChatHeaderActions() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  
  const { conversation } = useConversation(
    (window.location.pathname.match(/[0-9a-fA-F-]{36,}/)?.[0] ?? "")
  );
  const { profile } = useProfile();
  const recipient = useMemo(() => {
    if (!conversation || !profile) return null;
    return (conversation.participants || []).find(p => p.id !== profile.id);
  }, [conversation, profile]);

  // Unique room id for this video call
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
    outgoingInvitation,
    sendInvitation,
    respondInvitation,
    cancelOutgoing,
    loading: inviteLoading,
    clear
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  // State to track previous invitation to show cancel toast on recipient side
  const prevInvitationRef = useRef(invitation);

  useEffect(() => {
    // If we previously had a pending invitation and now it's gone, show "Call cancelled" toast
    if (
      prevInvitationRef.current &&
      prevInvitationRef.current.status === "pending" &&
      !invitation
    ) {
      toast.info("Call cancelled");
    }
    prevInvitationRef.current = invitation;
  }, [invitation]);

  // Whether call invite dialog should be open (source of truth: invitation is pending)
  const inviteDialogOpen = !!invitation && invitation.status === "pending";

  // Initiate a call: send an invite to recipient, show outgoing dialog
  const handleStartCall = async () => {
    if (!recipient?.id) {
      toast.error("No recipient found for call");
      return;
    }
    try {
      await sendInvitation(recipient.id, roomId);
      // The outgoing "Calling..." dialog will be triggered by outgoingInvitation state
    } catch (err) {
      toast.error("Failed to send video call invitation");
    }
  };

  // Accept/reject a received invite (only receiver will see this)
  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    const success = await respondInvitation(invitation.id, accept);
    if (accept && success) {
      setShowVideoCall(true);
    } else if (!accept) {
      toast.info("Video call invitation rejected");
      clear(); // always clear unused invitation state to trigger dialog close
      setShowVideoCall(false);
    }
  };

  // When closing the VideoCallDialog, reset dialogs
  const handleCloseCallDialog = (open: boolean) => {
    setShowVideoCall(open);
    if (!open) clear();
  };

  // Cancel call (sender only)
  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    toast.info("Call cancelled");
    clear(); // this clears both outgoing and potential incoming invitation state
    setShowVideoCall(false);
  };

  // Listen for status changes to open the video dialog at the right time
  // If I'm the sender and my outgoing invite turns "accepted", open the call screen
  const prevOutgoingStatus = useRef<string | null>(null);
  if (
    outgoingInvitation &&
    outgoingInvitation.status === "accepted" &&
    prevOutgoingStatus.current !== "accepted" &&
    !showVideoCall
  ) {
    setShowVideoCall(true);
    prevOutgoingStatus.current = "accepted";
  }
  if (outgoingInvitation && outgoingInvitation.status !== prevOutgoingStatus.current) {
    prevOutgoingStatus.current = outgoingInvitation.status;
  }
  if (!outgoingInvitation && showVideoCall) {
    setShowVideoCall(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={handleStartCall}
        title="Start Video Call"
        disabled={inviteLoading || !!outgoingInvitation}
      >
        <Video className="h-5 w-5" />
      </Button>

      {outgoingInvitation && outgoingInvitation.status === "pending" && (
        <VideoCallOutgoingDialog
          open={true}
          loading={inviteLoading}
          onCancel={handleCancelOutgoing}
          recipientName={
            conversation?.participants?.find(p => p.id === outgoingInvitation.recipient_id)?.first_name ||
            "Recipient"
          }
        />
      )}

      {showVideoCall && (
        <VideoCallDialog
          open={showVideoCall}
          onOpenChange={handleCloseCallDialog}
          roomId={
            (invitation?.status === "accepted" ? invitation.room_id :
              outgoingInvitation?.status === "accepted" ? outgoingInvitation.room_id :
                roomId)
          }
        />
      )}

      <VideoCallInviteDialog
        open={inviteDialogOpen}
        onRespond={handleRespondInvite}
        loading={inviteLoading}
        inviterName={
          conversation?.participants?.find(p => p.id === invitation?.sender_id)?.first_name ||
          "Someone"
        }
      />

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
