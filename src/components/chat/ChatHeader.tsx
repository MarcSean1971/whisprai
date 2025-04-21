
import { BackButton } from "@/components/ui/back-button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useUserPresence } from "@/hooks/use-user-presence";
import { useWebRTCCalls } from "@/hooks/use-webrtc-calls";
import { useWebRTCPeer } from "@/hooks/use-webrtc-peer";
import { useState } from "react";
import { ChatParticipantDialog } from "./ChatParticipantDialog";
import { CallUI } from "./CallUI";
import { ChatParticipantsInfo } from "./header/ChatParticipantsInfo";
import { ChatCallActions } from "./header/ChatCallActions";
import { ChatHeaderActions } from "./header/ChatHeaderActions";

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

  const shouldShowCallUI = !!callSession;
  const isCaller = callSession && profile?.id && callSession.caller_id === profile.id;

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
    initiator: !!isCaller,
    onSignal: s => {
      if (callSession) {
        updateSignalingData(callSession.id, s);
      }
    },
    remoteSignal,
  });

  const handleEndCall = () => {
    if (callSession) {
      endCall(callSession.id);
    }
    disconnectCall();
  };

  const handleParticipantClick = (participant: any) => {
    setSelectedParticipant(participant);
    setShowProfile(true);
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
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
          <ChatParticipantsInfo 
            participants={otherParticipants}
            onParticipantClick={handleParticipantClick}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {recipient && (
            <ChatCallActions
              isOnline={isOnline}
              isCalling={isCalling}
              onStartCall={startCall}
              recipientName={`${recipient.first_name || ''} ${recipient.last_name || ''}`.trim()}
            />
          )}
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
