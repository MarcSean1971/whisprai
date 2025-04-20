
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CallStream } from "./CallStream";
import { useVonageCall } from "@/hooks/use-vonage-call";

interface VoiceCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  conversationId?: string;
}

export function VoiceCallDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  conversationId,
}: VoiceCallDialogProps) {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const publisherRef = useRef<HTMLDivElement>(null);
  const subscriberRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnecting,
    isConnected,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio,
    hasRemoteParticipant,
    error
  } = useVonageCall({
    publisherElement: 'publisher',
    subscriberElement: 'subscriber',
    recipientId,
    conversationId
  });

  useEffect(() => {
    if (isOpen && conversationId) {
      connect();
    }
    
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isOpen, conversationId, connect, disconnect, isConnected]);

  const handleToggleAudio = () => {
    toggleAudio();
    setIsMicActive(!isMicActive);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoActive(!isVideoActive);
  };

  const handleEndCall = () => {
    disconnect();
    onClose();
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      onClose();
    }
  }, [error, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isConnecting ? `Calling ${recipientName}...` : `Call with ${recipientName}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 h-96">
          {isConnecting && !isConnected ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Connecting to call...</p>
            </div>
          ) : (
            <div className="relative h-full flex flex-col">
              <div 
                id="subscriber" 
                ref={subscriberRef}
                className={`bg-muted rounded-md w-full h-full ${!hasRemoteParticipant ? 'hidden' : ''}`}
              />
              
              <div 
                id="publisher" 
                ref={publisherRef}
                className={`bg-primary-foreground rounded-md ${hasRemoteParticipant ? 'absolute top-2 right-2 w-1/4 h-1/4' : 'w-full h-full'}`}
              />
              
              {!hasRemoteParticipant && isConnected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">Waiting for {recipientName} to join...</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAudio}
              disabled={isConnecting}
            >
              {isMicActive ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleVideo}
              disabled={isConnecting}
            >
              {isVideoActive ? (
                <Video className="h-4 w-4" />
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
