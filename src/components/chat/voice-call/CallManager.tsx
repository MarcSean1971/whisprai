
import React, { useState, useEffect } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { useCallTimeouts } from "./hooks/useCallTimeouts";
import { useCallDialogState } from "./hooks/useCallDialogState";
import { useCallParticipantNames } from "./hooks/useCallParticipantNames";
import { useCallHandlers } from "./CallHandlers";

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

  const { fetchProfileName } = useCallParticipantNames();

  useEffect(() => {
    if (incomingCall) fetchProfileName(incomingCall.caller_id, setCallerName);
    if (outgoingCall) fetchProfileName(outgoingCall.recipient_id, setRecipientName);
  }, [incomingCall, outgoingCall, fetchProfileName]);

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

  return (
    <>
      <IncomingCallDialog
        call={showIncomingDialog ? incomingCall : null}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        callerName={callerName}
        timeoutSecs={incomingTimeout}
      />
      {((currentCall && showCallDialog) || callError) && (
        <VoiceCallDialog
          isOpen={!!(showCallDialog || callError)}
          onClose={handleCloseCallDialog}
          recipientId={isOutgoing && currentCall ? currentCall.recipient_id : currentCall ? currentCall.caller_id : ""}
          recipientName={isOutgoing ? recipientName : callerName}
          conversationId={currentCall?.conversation_id}
          callStatus={currentCall?.status}
          errorMsg={callError}
          timeoutSecs={outgoingTimeout}
        />
      )}
    </>
  );
}
