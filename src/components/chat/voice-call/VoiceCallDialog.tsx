import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
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
}

export function VoiceCallDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  conversationId,
  callStatus,
}: VoiceCallDialogProps) {
  const publisherRef = useRef<HTMLDivElement>(null);
  const subscriberRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useUserPresence(recipientId);
  const [callInitiated, setCallInitiated] = useState(false);
  
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
    if (isConnecting) {
      console.info("[VoiceCallDialog][Vonage] Attempting connection: isConnecting");
    }
    if (isConnected) {
      console.info("[VoiceCallDialog][Vonage] Connection established: isConnected");
    }
    if (hasRemoteParticipant) {
      console.info("[VoiceCallDialog][Vonage] Remote participant joined");
    }
    if (!isConnecting && !isConnected) {
      console.info("[VoiceCallDialog][Vonage] No active connection");
    }
  }, [isConnecting, isConnected, hasRemoteParticipant]);

  useEffect(() => {
    if (isOpen && conversationId && (isOnline || callStatus === 'accepted') && !callInitiated) {
      console.log("[VoiceCall] Initiating call to user:", recipientId, "Status:", callStatus);
      const timer = setTimeout(() => {
        setCallInitiated(true);
        connect();
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, conversationId, connect, isOnline, callInitiated, recipientId, callStatus]);
  
  useEffect(() => {
    if (callInitiated && !isOnline && !hasRemoteParticipant && isConnecting && callStatus !== 'accepted') {
      toast.error(`${recipientName} appears to be offline.`);
      disconnect();
      onClose();
    }
  }, [callInitiated, isOnline, hasRemoteParticipant, isConnecting, recipientName, disconnect, onClose, callStatus]);
  
  useEffect(() => {
    if (!isOpen && isConnected) {
      disconnect();
      setCallInitiated(false);
    }
    return () => {
      if (isConnected) {
        disconnect();
        setCallInitiated(false);
      }
    };
  }, [isOpen, disconnect, isConnected]);

  useEffect(() => {
    if (isOpen) {
      console.debug("[VoiceCallDialog][DEBUG] Dialog opened", {
        recipientId, recipientName, conversationId, callStatus, isOnline,
        isConnecting, isConnected, hasRemoteParticipant, error,
      });
    }
  }, [isOpen, recipientId, recipientName, conversationId, callStatus, isOnline, isConnecting, isConnected, hasRemoteParticipant, error]);

  useEffect(() => {
    if (error) {
      console.error('Call error:', error);
      toast.error(error.message || "An error occurred during the call");
      setCallInitiated(false);
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleEndCall = () => {
    disconnect();
    setCallInitiated(false);
    onClose();
  };

  const getDialogTitle = () => {
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
          {isConnecting && !isConnected && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Connecting to call...</p>
            </div>
          )}
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
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
