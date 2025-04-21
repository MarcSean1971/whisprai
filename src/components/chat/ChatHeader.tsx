
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { Search, Phone, Video, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ChatParticipantDialog } from "./ChatParticipantDialog";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { useUserPresence } from "@/hooks/use-user-presence";
import { useWebRTCCalls } from "@/hooks/use-webrtc-calls";
import { toast } from "sonner";
import { CallUI } from "./CallUI";
import { useWebRTCPeer } from "@/hooks/use-webrtc-peer";

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

  const {
    isCalling, 
    callSession, 
    startCall, 
    incomingCall, 
    acceptCall, 
    rejectCall, 
    status, 
    updateSignalingData, 
    remoteSignal,
    endCall,
  } = useWebRTCCalls(conversationId, profile?.id || "", recipient?.id || "");

  // Set up peer connection when in "pending" (if this user is caller) or "connected"
  const shouldShowCallUI = !!callSession; // Changed to show for all session states
  const isCaller = callSession && profile?.id && callSession.caller_id === profile.id;

  // Use the peer connection hook
  const {
    localStream,
    remoteStream,
    isAudioMuted,
    toggleAudio,
    isVideoMuted,
    toggleVideo,
    endCall: disconnectCall,
    isConnecting,
    callStatus,
    isScreenSharing,
    toggleScreenShare,
    callDuration
  } = useWebRTCPeer({
    initiator: !!isCaller, // caller initiates, callee does not
    onSignal: s => {
      if (callSession) {
        updateSignalingData(callSession.id, s);
      }
    },
    remoteSignal,
  });

  // Handle call ending from peer
  useEffect(() => {
    if (callStatus === "ended" && callSession) {
      endCall(callSession.id);
    }
  }, [callStatus, callSession, endCall]);
  
  // Handle manual call end
  const handleEndCall = () => {
    if (callSession) {
      endCall(callSession.id);
    }
    disconnectCall();
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      {/* Dedicated Call UI Modal */}
      {shouldShowCallUI && (
        <CallUI
          localStream={localStream}
          remoteStream={remoteStream}
          isAudioMuted={isAudioMuted}
          onToggleAudio={toggleAudio}
          isVideoMuted={isVideoMuted}
          onToggleVideo={toggleVideo}
          onEndCall={handleEndCall}
          isConnecting={isConnecting}
          callStatus={callStatus}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={toggleScreenShare}
          duration={callDuration}
          onAcceptCall={!isCaller ? acceptCall : undefined}
          onRejectCall={!isCaller ? rejectCall : undefined}
        />
      )}
      
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {participantDetails.map(p => p.name).join(', ')}
                  </span>
                  {/* Removed online badge as requested */}
                </div>
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
              {/* Call buttons */}
              <div className="flex items-center gap-2">
                {/* Video call button */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${isOnline ? 'hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30' : ''}`}
                  disabled={isCalling || !isOnline}
                  title={`Video call ${participantDetails[0]?.name || "participant"}`}
                  onClick={() => {
                    if (!isOnline) {
                      toast.error("Recipient is offline");
                      return;
                    }
                    startCall("video");
                  }}
                >
                  <Video className="h-5 w-5" />
                  <span className="sr-only">Video Call</span>
                </Button>
                
                {/* Audio call button */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${isOnline ? 'bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-500' : ''}`}
                  disabled={isCalling || !isOnline}
                  title={`Call ${participantDetails[0]?.name || "participant"}`}
                  onClick={() => {
                    if (!isOnline) {
                      toast.error("Recipient is offline");
                      return;
                    }
                    startCall("audio");
                  }}
                >
                  <Phone className="h-5 w-5" />
                  <span className="sr-only">Call</span>
                </Button>
                
                {/* Removed call history button and drawer as requested */}
              </div>
              
              {/* Basic incoming call dialog */}
              {incomingCall && status === "incoming" && (
                <div className="flex items-center gap-2 bg-black/10 backdrop-blur-sm p-2 rounded-lg ml-2 animate-pulse">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Incoming {incomingCall.call_type} call...</span>
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={acceptCall}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10" onClick={rejectCall}>
                        Decline
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={rejectCall}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
