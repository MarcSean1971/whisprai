
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

  const {
    isConnecting,
    isConnected,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    hasRemoteParticipant,
    error,
    isMicActive,
    isVideoActive
  } = useVonageCall({
    publisherRef,
    subscriberRef,
    recipientId,
    conversationId
  });

  useEffect(() => {
    if (errorMsg) {
      setInternalError(errorMsg);
      console.log("[VoiceCallDialog] External error received:", errorMsg);
    }
    else setInternalError(null);
  }, [errorMsg]);

  useEffect(() => {
    if (isOpen && conversationId && !internalError && (isOnline || callStatus === 'accepted') && !callInitiated) {
      const timer = setTimeout(() => {
        setCallInitiated(true);
        connect();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, conversationId, connect, isOnline, callInitiated, recipientId, callStatus, internalError]);

  useEffect(() => {
    if (callInitiated && !isOnline && !hasRemoteParticipant && isConnecting && callStatus !== 'accepted') {
      setInternalError(`${recipientName} appears to be offline.`);
      disconnect();
      setCallInitiated(false);
      setShowEndBanner(true);
      setTimeout(() => {
        setShowEndBanner(false);
        onClose();
      }, 2000);
    }
  }, [callInitiated, isOnline, hasRemoteParticipant, isConnecting, recipientName, disconnect, onClose, callStatus]);

  useEffect(() => {
    if (!isOpen && isConnected) {
      disconnect();
      setCallInitiated(false);
      setShowEndBanner(false);
    }
    return () => {
      if (isConnected) {
        disconnect();
        setCallInitiated(false);
        setShowEndBanner(false);
      }
    };
  }, [isOpen, disconnect, isConnected]);

  useEffect(() => {
    if (error) {
      setInternalError(error.message || "An error occurred during the call");
      setShowEndBanner(true);
      setCallInitiated(false);
      setTimeout(() => {
        setShowEndBanner(false);
        onClose();
      }, 2000);
    }
  }, [error, onClose]);

  const handleToggleAudio = () => { toggleAudio(); };
  const handleToggleVideo = () => { toggleVideo(); };

  const handleEndCall = () => {
    disconnect();
    setCallInitiated(false);
    setInternalError("Call ended.");
    setShowEndBanner(true);
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
