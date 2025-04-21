
import React, { useState, useEffect } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { SimplePeerCallDialog } from "./SimplePeerCallDialog";
import { useCallTimeouts } from "./hooks/useCallTimeouts";
import { useCallDialogState } from "./hooks/useCallDialogState";
import { useCallParticipantNames } from "./hooks/useCallParticipantNames";
import { useCallHandlers } from "./CallHandlers";
import { useProfile } from "@/hooks/use-profile";
import { useUserPresence } from "@/hooks/use-user-presence";
import { supabase } from "@/integrations/supabase/client";

export function CallManager() {
  const { incomingCall, outgoingCall, acceptCall, rejectCall, endCall, timeoutCall } = useActiveCalls();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState("Someone");
  const [recipientName, setRecipientName] = useState("Someone");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [currentCall, setCurrentCall] = useState<ActiveCall | null>(null);
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [showIncomingDialog, setShowIncomingDialog] = useState(false);
  const [dismissedCallId, setDismissedCallId] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { refreshPresence } = useUserPresence(profile?.id);

  const { fetchProfileName } = useCallParticipantNames();

  // Add manual refresh of recipient presence when a call is received
  useEffect(() => {
    if (incomingCall) {
      // When we receive a call, immediately refresh our own presence
      refreshPresence();
      
      // Also fetch caller profile name
      fetchProfileName(incomingCall.caller_id, setCallerName);
      
      // Attempt to update the caller's last seen status (to force them online)
      if (incomingCall.caller_id) {
        const updateCallerPresence = async () => {
          try {
            // Check if caller has presence record
            const { data } = await supabase
              .from('user_presence')
              .select('*')
              .eq('user_id', incomingCall.caller_id)
              .single();
            
            console.log("[CallManager] Caller presence data:", data);
          } catch (err) {
            console.error("[CallManager] Error checking caller presence:", err);
          }
        };
        
        updateCallerPresence();
      }
    }
    
    if (outgoingCall) {
      // When we make a call, refresh our presence and fetch recipient name
      refreshPresence();
      fetchProfileName(outgoingCall.recipient_id, setRecipientName);
    }
  }, [incomingCall, outgoingCall, fetchProfileName, refreshPresence]);

  const { incomingTimeout, outgoingTimeout } = useCallTimeouts({
    incomingCall,
    outgoingCall,
    dismissedCallId,
    timeoutCall,
    endCall,
    setShowIncomingDialog,
    setShowCallDialog,
    setCurrentCall,
    setCallError,
    setDismissedCallId,
  });

  useCallDialogState({
    incomingCall,
    outgoingCall,
    dismissedCallId,
    setShowIncomingDialog,
    setShowCallDialog,
    setCurrentCall,
    setIsOutgoing,
    setCallError,
    setActiveSessionId,
    setCallerName,
    setRecipientName,
    setDismissedCallId,
  });

  const { handleAcceptCall, handleRejectCall, handleCloseCallDialog } = useCallHandlers({
    incomingCall,
    outgoingCall,
    acceptCall,
    rejectCall,
    endCall,
    setShowIncomingDialog,
    setDismissedCallId,
    setCallError,
    setShowCallDialog,
    setCurrentCall,
    setIsOutgoing,
    currentCall,
  });

  const renderCallDialog = () => {
    if (!currentCall && !callError) return null;

    const isP2PCall = currentCall?.call_type === 'p2p';
    const partnerId = isOutgoing && currentCall ? currentCall.recipient_id : currentCall ? currentCall.caller_id : "";
    const partnerName = isOutgoing ? recipientName : callerName;

    if (isP2PCall) {
      return (
        <SimplePeerCallDialog
          isOpen={!!(showCallDialog || callError)}
          onClose={handleCloseCallDialog}
          callId={currentCall?.id || ''}
          recipientName={partnerName}
          isInitiator={isOutgoing}
          timeoutSecs={outgoingTimeout}
        />
      );
    } else {
      return (
        <VoiceCallDialog
          isOpen={!!(showCallDialog || callError)}
          onClose={handleCloseCallDialog}
          recipientId={partnerId}
          recipientName={partnerName}
          conversationId={currentCall?.conversation_id}
          callStatus={currentCall?.status}
          errorMsg={callError}
          timeoutSecs={outgoingTimeout}
        />
      );
    }
  };

  return (
    <>
      <IncomingCallDialog
        call={showIncomingDialog ? incomingCall : null}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        callerName={callerName}
        timeoutSecs={incomingTimeout}
      />
      {renderCallDialog()}
    </>
  );
}
