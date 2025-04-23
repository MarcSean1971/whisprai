
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

  const roomId = useMemo(() => {
    const convoId = conversation?.id ?? "whispr123";
    if (profile && recipient) {
      return `${convoId.substr(0, 8)}_${profile.id.substr(0, 8)}_${recipient.id.substr(0, 8)}`;
    }
    return convoId;
  }, [conversation, profile, recipient]);

  const {
    invitation,
    outgoingInvitation,
    sendInvitation,
    respondInvitation,
    cancelOutgoing,
    loading: inviteLoading,
    clear
  } = useVideoCallInvitations(conversation?.id ?? "", profile?.id ?? "");

  // Robustly control showing/hiding of the VideoCallDialog
  const prevInvitationRef = useRef(invitation);
  const prevOutgoingRef = useRef(outgoingInvitation);
  const prevShowVideoCallRef = useRef(showVideoCall);

  useEffect(() => {
    console.log("[VideoCall][HeaderActions] (INVITATION HOOK STATE)", {
      invitation,
      outgoingInvitation,
      showVideoCall
    });

    // If incoming invite was cleared (call cancelled)
    if (
      prevInvitationRef.current &&
      prevInvitationRef.current.status === "pending" &&
      !invitation
    ) {
      toast.info("Call cancelled");
      console.log("[VideoCall][HeaderActions] Call cancelled toast shown");
      setShowVideoCall(false);
    }
    prevInvitationRef.current = invitation;
  }, [invitation]);

  useEffect(() => {
    // Outgoing accepted: show dialog
    if (
      outgoingInvitation &&
      outgoingInvitation.status === "accepted" &&
      !showVideoCall
    ) {
      setShowVideoCall(true);
      console.log("[VideoCall][HeaderActions] Outgoing call accepted, showing dialog");
    }
    // Outgoing no longer valid: hide dialog
    if (!outgoingInvitation && prevOutgoingRef.current && prevOutgoingRef.current.status === "accepted") {
      setShowVideoCall(false);
      console.log("[VideoCall][HeaderActions] Outgoing accepted cleared, hiding dialog");
    }
    prevOutgoingRef.current = outgoingInvitation;
  }, [outgoingInvitation, showVideoCall]);

  useEffect(() => {
    // If we have an incoming invitation accepted, show dialog and clear dialog only when incoming/outgoing closes
    if (invitation && invitation.status === "accepted" && !showVideoCall) {
      setShowVideoCall(true);
      console.log("[VideoCall][HeaderActions] Incoming call accepted, showing dialog");
    }
    if (!invitation && prevInvitationRef.current && prevInvitationRef.current.status === "accepted") {
      setShowVideoCall(false);
      console.log("[VideoCall][HeaderActions] Incoming accepted cleared, hiding dialog");
    }
    // No need to update prevInvitationRef here as that's managed in the other effect
  }, [invitation, showVideoCall]);

  // Closing dialog should clear all invitation state as needed
  const handleCloseCallDialog = (open: boolean) => {
    setShowVideoCall(open);
    if (!open) {
      clear();
      console.log("[VideoCall][HeaderActions] Video call dialog closed, cleared invitations");
    }
  };

  const handleStartCall = async () => {
    if (!recipient?.id) {
      toast.error("No recipient found for call");
      return;
    }
    try {
      await sendInvitation(recipient.id, roomId);
    } catch (err) {
      toast.error("Failed to send video call invitation");
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!invitation) return;
    const success = await respondInvitation(invitation.id, accept);
    if (accept && success) {
      setShowVideoCall(true);
      console.log("[VideoCall][HeaderActions] Accepted invitation, opening dialog");
    } else if (!accept) {
      toast.info("Video call invitation rejected");
      clear();
      setShowVideoCall(false);
    }
  };

  const handleCancelOutgoing = async () => {
    if (!outgoingInvitation) return;
    await cancelOutgoing(outgoingInvitation.id);
    toast.info("Call cancelled");
    clear();
    setShowVideoCall(false);
  };

  // Always true when you have a pending incoming invite
  const inviteDialogOpen = !!invitation && invitation.status === "pending";

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
