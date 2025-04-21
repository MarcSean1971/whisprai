
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
import { supabase } from "@/integrations/supabase/client";

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
  const maxCallAttempts = 3; // Increased from 2 to 3 for more attempts
  const [manualPresenceChecked, setManualPresenceChecked] = useState(false);
  const [recipientConfirmedOffline, setRecipientConfirmedOffline] = useState(false);

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

  // Add a function to manually check presence in the database
  const checkRecipientPresenceDirectly = async () => {
    if (!recipientId) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('last_seen_at')
        .eq('user_id', recipientId)
        .single();
        
      if (error) {
        console.error("[VoiceCallDialog] Error checking recipient presence directly:", error);
        return false;
      }
      
      if (data && data.last_seen_at) {
        const lastSeen = new Date(data.last_seen_at);
        // Use 5 minutes as threshold
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isRecipientOnline = lastSeen > fiveMinutesAgo;
        
        console.log("[VoiceCallDialog] Manual presence check:", {
          recipientId,
          lastSeen,
          fiveMinutesAgo,
          isOnline: isRecipientOnline
        });
        
        return isRecipientOnline;
      }
      
      return false;
    } catch (err) {
      console.error("[VoiceCallDialog] Failed to check recipient presence:", err);
      return false;
    }
  };

  useEffect(() => {
    if (errorMsg) {
      console.log("[VoiceCallDialog] External error received:", errorMsg);
      setInternalError(errorMsg);
    }
    else if (!isOpen) {
      setInternalError(null);
    }
  }, [errorMsg, isOpen]);

  useEffect(() => {
    if (isOpen && conversationId && !internalError && !callInitiated) {
      // First perform a manual presence check before deciding if user is offline
      const performManualPresenceCheck = async () => {
        if (!manualPresenceChecked) {
          const isRecipientOnlineDirectly = await checkRecipientPresenceDirectly();
          setManualPresenceChecked(true);
          
          // If they're actually online despite what isOnline hook says
          if (isRecipientOnlineDirectly) {
            console.log("[VoiceCallDialog] Manual check shows recipient is online, proceeding with call");
            setCallInitiated(true);
            callAttempts.current += 1;
            connect();
          } else if (isOnline || callStatus === 'accepted') {
            console.log("[VoiceCallDialog] Initiating call:", { 
              callStatus, isOnline, recipientId, conversationId 
            });
            
            setCallInitiated(true);
            callAttempts.current += 1;
            connect();
          } else {
            console.log("[VoiceCallDialog] Both checks indicate recipient is offline:", { isOnline, callStatus });
            setRecipientConfirmedOffline(true);
            setInternalError(`${recipientName} appears to be offline.`);
            setShowEndBanner(true);
            setTimeout(() => {
              setShowEndBanner(false);
              onClose();
            }, 3000);
          }
        }
      };
      
      performManualPresenceCheck();
    }
  }, [isOpen, conversationId, connect, isOnline, callInitiated, recipientId, callStatus, internalError, recipientName, onClose, manualPresenceChecked]);

  useEffect(() => {
    if (callInitiated && !isOnline && !hasRemoteParticipant && isConnecting && callStatus !== 'accepted') {
      if (callAttempts.current < maxCallAttempts) {
        console.log("[VoiceCallDialog] Retrying call, attempt:", callAttempts.current);
        disconnect();
        const timer = setTimeout(async () => {
          // Before retrying, check presence again
          const isRecipientOnlineDirectly = await checkRecipientPresenceDirectly();
          
          if (isRecipientOnlineDirectly || callStatus === 'accepted') {
            console.log("[VoiceCallDialog] Recipient appears online on retry, continuing call");
            callAttempts.current += 1;
            connect();
          } else {
            console.log("[VoiceCallDialog] Recipient still offline, retry attempt:", callAttempts.current);
            callAttempts.current += 1;
            connect();
          }
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

  useEffect(() => {
    if (!isOpen && (isConnected || isConnecting)) {
      console.log("[VoiceCallDialog] Dialog closed, cleaning up call");
      disconnect();
      setCallInitiated(false);
      setShowEndBanner(false);
      callAttempts.current = 0;
      setManualPresenceChecked(false);
      setRecipientConfirmedOffline(false);
    }
    
    return () => {
      if (isConnected || isConnecting) {
        console.log("[VoiceCallDialog] Component unmounting, cleaning up call");
        disconnect();
        setCallInitiated(false);
        setShowEndBanner(false);
        callAttempts.current = 0;
        setManualPresenceChecked(false);
        setRecipientConfirmedOffline(false);
      }
    };
  }, [isOpen, disconnect, isConnected, isConnecting]);

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
