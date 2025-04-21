
import { useState, useCallback, useRef } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { supabase } from "@/integrations/supabase/client";
import { useCallTimeouts } from "./hooks/useCallTimeouts";
import { useCallDialogState } from "./hooks/useCallDialogState";

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

  // Call name fetch
  useCallback(() => {}, []);

  // Fetch participant names
  const fetchProfileName = useCallback(async (userId: string, setName: (name: string) => void) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      if (error) throw error;
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      setName(fullName || 'User');
    } catch (error) {
      setName('User');
    }
  }, []);

  // Update names whenever relevant call changes
  React.useEffect(() => {
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

  const handleAcceptCall = async (callId: string) => {
    setShowIncomingDialog(false);
    setDismissedCallId(callId);
    setCallError(null);
    return await acceptCall(callId);
  };

  const handleRejectCall = async (callId: string) => {
    setShowIncomingDialog(false);
    setDismissedCallId(callId);
    setCallError("Call declined.");
    await rejectCall(callId);
    return true;
  };

  const handleCloseCallDialog = () => {
    if (currentCall) {
      endCall(currentCall.id);
      setDismissedCallId(currentCall.id);
      setCallError("Call ended.");
    }
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
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
