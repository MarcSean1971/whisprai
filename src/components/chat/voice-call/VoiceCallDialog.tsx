
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVonageCall } from "@/hooks/use-vonage-call";
import { useUserPresence } from "@/hooks/use-user-presence";
import { CallMediaStreams } from "./CallMediaStreams";
import { CallControlButtons } from "./CallControlButtons";
import { CallStatusDisplay } from "./CallStatusDisplay";
import { toast } from "sonner";

interface VoiceCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  conversationId?: string;
  callStatus?: string;
  errorMsg?: string | null;
  timeoutSecs?: number;
}

export function VoiceCallDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  conversationId,
  callStatus,
  errorMsg,
  timeoutSecs = 0
}: VoiceCallDialogProps) {
  const publisherRef = useRef<HTMLDivElement>(null);
  const subscriberRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useUserPresence(recipientId);
  const [callInitiated, setCallInitiated] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [showEndBanner, setShowEndBanner] = useState(false);
  const callAttempts = useRef(0);
  const maxCallAttempts = 2;

  const {
    isConnecting,
    isConnected,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    hasRemoteParticipant,
    error: vonageError,
    isMicActive,
    isVideoActive
  } = useVonageCall({
    publisherRef,
    subscriberRef,
    recipientId,
    conversationId
  });

  // Handle external error messages
  useEffect(() => {
    if (errorMsg) {
      console.log("[VoiceCallDialog] External error received:", errorMsg);
      setInternalError(errorMsg);
    }
    else if (!isOpen) {
      setInternalError(null);
    }
  }, [errorMsg, isOpen]);

  // Initiate call when dialog opens
  useEffect(() => {
    if (isOpen && conversationId && !internalError && !callInitiated) {
      // Only attempt call if user is online or call status is accepted
      if (isOnline || callStatus === 'accepted') {
        console.log("[VoiceCallDialog] Initiating call:", { 
          callStatus, isOnline, recipientId, conversationId 
        });
        
        const timer = setTimeout(() => {
          setCallInitiated(true);
          callAttempts.current += 1;
          connect();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // Handle offline recipient immediately
        console.log("[VoiceCallDialog] Recipient appears offline:", { isOnline, callStatus });
        setInternalError(`${recipientName} appears to be offline.`);
        setShowEndBanner(true);
        const timer = setTimeout(() => {
          setShowEndBanner(false);
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, conversationId, connect, isOnline, callInitiated, recipientId, callStatus, internalError, recipientName, onClose]);

  // Handle call connection state changes
  useEffect(() => {
    // If we're trying to connect but recipient is offline and not already in the call
    if (callInitiated && !isOnline && !hasRemoteParticipant && isConnecting && callStatus !== 'accepted') {
      if (callAttempts.current < maxCallAttempts) {
        console.log("[VoiceCallDialog] Retrying call, attempt:", callAttempts.current);
        disconnect();
        const timer = setTimeout(() => {
          callAttempts.current += 1;
          connect();
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        console.log("[VoiceCallDialog] Max call attempts reached, recipient offline");
        setInternalError(`${recipientName} appears to be offline.`);
        disconnect();
        setCallInitiated(false);
        setShowEndBanner(true);
        setTimeout(() => {
          setShowEndBanner(false);
          onClose();
        }, 3000);
      }
    }
  }, [callInitiated, isOnline, hasRemoteParticipant, isConnecting, recipientName, disconnect, onClose, callStatus, connect]);

  // Handle dialog close
  useEffect(() => {
    if (!isOpen && (isConnected || isConnecting)) {
      console.log("[VoiceCallDialog] Dialog closed, cleaning up call");
      disconnect();
      setCallInitiated(false);
      setShowEndBanner(false);
      callAttempts.current = 0;
    }
    
    return () => {
      if (isConnected || isConnecting) {
        console.log("[VoiceCallDialog] Component unmounting, cleaning up call");
        disconnect();
        setCallInitiated(false);
        setShowEndBanner(false);
        callAttempts.current = 0;
      }
    };
  }, [isOpen, disconnect, isConnected, isConnecting]);

  // Handle vonage errors
  useEffect(() => {
    if (vonageError) {
      console.error("[VoiceCallDialog] Vonage error:", vonageError);
      
      const errorMessage = vonageError.type === 'MEDIA_ACCESS_ERROR' 
        ? 'Microphone or camera access denied. Please check permissions.'
        : vonageError.message || "An error occurred during the call";
      
      setInternalError(errorMessage);
      toast.error(errorMessage);
      
      setShowEndBanner(true);
      setCallInitiated(false);
      
      setTimeout(() => {
        setShowEndBanner(false);
        onClose();
      }, 3000);
    }
  }, [vonageError, onClose]);

  // Handle successfully connected call
  useEffect(() => {
    if (isConnected && hasRemoteParticipant && callInitiated) {
      toast.success(`Connected with ${recipientName}`);
    }
  }, [isConnected, hasRemoteParticipant, callInitiated, recipientName]);

  const handleToggleAudio = () => { toggleAudio(); };
  const handleToggleVideo = () => { toggleVideo(); };

  const handleEndCall = () => {
    disconnect();
    setCallInitiated(false);
    setInternalError("Call ended.");
    setShowEndBanner(true);
    toast.info("Call ended");
    
    setTimeout(() => {
      setShowEndBanner(false);
      onClose();
    }, 2000);
  };

  const getDialogTitle = () => {
    if (internalError) {
      return `Call Ended`;
    }
    if (callStatus === 'pending' && isConnecting && !isConnected) {
      return `Calling ${recipientName}...`;
    } else if (isConnected) {
      return `Call with ${recipientName}`;
    } else if (callStatus === 'accepted' && isConnecting) {
      return `Connecting to ${recipientName}...`;
    }
    return `Call with ${recipientName}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 h-96">
          <CallStatusDisplay
            internalError={internalError}
            isConnecting={isConnecting}
            isConnected={isConnected}
            timeoutSecs={timeoutSecs}
            recipientName={recipientName}
            showEndBanner={showEndBanner}
          />
          
          {!internalError && (
            <CallMediaStreams
              publisherRef={publisherRef}
              subscriberRef={subscriberRef}
              hasRemoteParticipant={hasRemoteParticipant}
              isConnected={isConnected}
              recipientName={recipientName}
              isVideoActive={isVideoActive}
            />
          )}
          
          {!internalError && (
            <CallControlButtons
              isConnecting={isConnecting}
              isMicActive={isMicActive}
              isVideoActive={isVideoActive}
              onToggleAudio={handleToggleAudio}
              onToggleVideo={handleToggleVideo}
              onEndCall={handleEndCall}
              internalError={internalError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
