
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useVonageCall } from "@/hooks/use-vonage-call";
import { useUserPresence } from "@/hooks/use-user-presence"; 

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

  // LABEL: -- Connection establishment and call error handling --
  useEffect(() => {
    if (errorMsg) {
      setInternalError(errorMsg);
      console.log("[VoiceCallDialog] External error received:", errorMsg);
    }
    else setInternalError(null);
  }, [errorMsg]);

  useEffect(() => {
    if (isOpen && conversationId && !internalError && (isOnline || callStatus === 'accepted') && !callInitiated) {
      console.log("[VoiceCallDialog] Starting call connection", {
        isOpen, conversationId, isOnline, callStatus, callInitiated
      });
      const timer = setTimeout(() => {
        setCallInitiated(true);
        connect();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, conversationId, connect, isOnline, callInitiated, recipientId, callStatus, internalError]);

  useEffect(() => {
    if (callInitiated && !isOnline && !hasRemoteParticipant && isConnecting && callStatus !== 'accepted') {
      console.log("[VoiceCallDialog] Recipient appears offline");
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
      console.log("[VoiceCallDialog] Dialog closed while connected, cleaning up");
      disconnect();
      setCallInitiated(false);
      setShowEndBanner(false);
    }
    return () => {
      if (isConnected) {
        console.log("[VoiceCallDialog] Component unmounting while connected, cleaning up");
        disconnect();
        setCallInitiated(false);
        setShowEndBanner(false);
      }
    };
  }, [isOpen, disconnect, isConnected]);

  useEffect(() => {
    if (error) {
      console.error("[VoiceCallDialog] Call error received:", error);
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
    console.log("[VoiceCallDialog] User ended call");
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
          {internalError && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="font-semibold">{internalError}</div>
              <div className="text-muted-foreground text-sm">Call could not start. Please try again.</div>
            </div>
          )}
          {isConnecting && !isConnected && !internalError && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Connecting to call...</p>
              {timeoutSecs > 0 && (
                <span className="mt-2 text-sm text-muted-foreground">Will time out in {timeoutSecs}s</span>
              )}
            </div>
          )}
          {!internalError && (
          <div className="relative h-full flex flex-col">
            <div 
              ref={subscriberRef}
              id="subscriber-container"
              className={`bg-muted rounded-md w-full h-full ${!hasRemoteParticipant ? 'hidden' : ''}`}
            />
            <div 
              ref={publisherRef}
              id="publisher-container"
              className={`bg-primary-foreground rounded-md ${hasRemoteParticipant ? 'absolute top-2 right-2 w-1/4 h-1/4 z-10' : 'w-full h-full'}`}
            />
            {!hasRemoteParticipant && isConnected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Waiting for {recipientName} to join...</p>
              </div>
            )}
          </div>
          )}
          {!internalError && (
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAudio}
              disabled={isConnecting}
              className={!isMicActive ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50" : ""}
            >
              {isMicActive ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4 text-red-500" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleVideo}
              disabled={isConnecting}
              className={isVideoActive ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50" : ""}
            >
              {isVideoActive ? (
                <Video className="h-4 w-4 text-green-500" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              disabled={!!internalError}
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
