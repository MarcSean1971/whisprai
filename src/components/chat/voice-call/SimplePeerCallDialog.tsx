
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSimplePeerCall } from "@/hooks/use-simple-peer-call";
import { CallControlButtons } from "./CallControlButtons";
import { CallStatusDisplay } from "./CallStatusDisplay";
import { toast } from "sonner";

interface SimplePeerCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  recipientName: string;
  isInitiator: boolean;
  timeoutSecs?: number;
}

export function SimplePeerCallDialog({
  isOpen,
  onClose,
  callId,
  recipientName,
  isInitiator,
  timeoutSecs = 0
}: SimplePeerCallDialogProps) {
  const [showEndBanner, setShowEndBanner] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    initialize,
    disconnect,
    toggleAudio,
    toggleVideo,
    isConnected,
    isConnecting,
    isMicActive,
    isVideoActive,
    localStream,
    remoteStream,
    error
  } = useSimplePeerCall({
    callId,
    isInitiator,
    onConnect: () => {
      toast.success(`Connected with ${recipientName}`);
    },
    onError: (err) => {
      setInternalError(`Connection error: ${err.message}`);
      toast.error(`Call error: ${err.message}`);
    }
  });
  
  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting && !internalError) {
      console.log("[SimplePeerCallDialog] Initializing peer connection");
      initialize();
    }
    
    return () => {
      if ((isConnected || isConnecting) && !isOpen) {
        console.log("[SimplePeerCallDialog] Dialog closed, cleaning up");
        disconnect();
      }
    };
  }, [isOpen, initialize, disconnect, isConnected, isConnecting, internalError]);
  
  useEffect(() => {
    if (error) {
      setInternalError(`Call error: ${error.message}`);
    }
  }, [error]);
  
  // Handle local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Handle remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  const handleEndCall = () => {
    disconnect();
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
    if (isConnecting && !isConnected) {
      return `Connecting to ${recipientName}...`;
    } else if (isConnected) {
      return `Call with ${recipientName}`;
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
            <div className="relative flex-1 bg-muted rounded-md overflow-hidden">
              {remoteStream && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              
              {!remoteStream && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">
                    {isConnecting ? "Connecting..." : "No video"}
                  </div>
                </div>
              )}
              
              {localStream && isVideoActive && (
                <div className="absolute bottom-4 right-4 w-1/4 h-1/4 bg-background rounded-md overflow-hidden border border-border">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
          
          {!internalError && (
            <CallControlButtons
              isConnecting={isConnecting}
              isMicActive={isMicActive}
              isVideoActive={isVideoActive}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onEndCall={handleEndCall}
              internalError={internalError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
