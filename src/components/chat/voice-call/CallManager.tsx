
import { useEffect, useState, useRef } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { supabase } from "@/integrations/supabase/client";

const INCOMING_CALL_TIMEOUT = 31000; // 31s 
const OUTGOING_CALL_TIMEOUT = 35000; // 35s, buffer for network lag

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
  const [incomingTimeout, setIncomingTimeout] = useState(0);
  const [outgoingTimeout, setOutgoingTimeout] = useState(0);

  const incomingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const outgoingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extra call debugging
  useEffect(() => {
    if (incomingCall || outgoingCall) {
      console.debug("[CallManager][DEBUG][STATE]", { incomingCall, outgoingCall });
    }
  }, [incomingCall, outgoingCall]);

  useEffect(() => {
    const fetchProfileName = async (userId: string, setName: (name: string) => void) => {
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
    };
    if (incomingCall) fetchProfileName(incomingCall.caller_id, setCallerName);
    if (outgoingCall) fetchProfileName(outgoingCall.recipient_id, setRecipientName);
  }, [incomingCall, outgoingCall]);

  // Set up timeout for unanswered incoming calls
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'pending' && incomingCall.id !== dismissedCallId) {
      setShowIncomingDialog(true);
      setShowCallDialog(false);
      setCurrentCall(null);
      setIsOutgoing(false);
      setCallError(null);

      setIncomingTimeout(INCOMING_CALL_TIMEOUT / 1000);

      // Clear any running timer before starting new one
      if (incomingTimerRef.current) clearTimeout(incomingTimerRef.current);
      // Start timer to auto-reject incoming if not answered
      incomingTimerRef.current = setTimeout(async () => {
        setShowIncomingDialog(false);
        setCallError("Missed call: no answer.");
        setDismissedCallId(incomingCall.id);
        await timeoutCall(incomingCall.id);
      }, INCOMING_CALL_TIMEOUT);

      // Countdown for dialog
      const interval = setInterval(() => {
        setIncomingTimeout((secs) => (secs > 0 ? secs - 1 : 0));
      }, 1000);
      return () => {
        clearTimeout(incomingTimerRef.current!);
        clearInterval(interval);
      };
    } else {
      setIncomingTimeout(0);
      if (incomingTimerRef.current) clearTimeout(incomingTimerRef.current);
    }
  }, [incomingCall, dismissedCallId, timeoutCall]);

  // Outgoing timeout for unanswered outgoing call
  useEffect(() => {
    if (outgoingCall && outgoingCall.status === "pending") {
      setOutgoingTimeout(OUTGOING_CALL_TIMEOUT / 1000);
      if (outgoingTimerRef.current) clearTimeout(outgoingTimerRef.current);
      outgoingTimerRef.current = setTimeout(() => {
        setShowCallDialog(false);
        setCurrentCall(null);
        setCallError("Call could not start, recipient did not answer.");
        setDismissedCallId(outgoingCall.id);
        endCall(outgoingCall.id);
      }, OUTGOING_CALL_TIMEOUT);

      const interval = setInterval(() => {
        setOutgoingTimeout(x => (x > 0 ? x - 1 : 0));
      }, 1000);

      return () => {
        clearTimeout(outgoingTimerRef.current!);
        clearInterval(interval);
      };
    } else {
      setOutgoingTimeout(0);
      if (outgoingTimerRef.current) clearTimeout(outgoingTimerRef.current);
    }
  }, [outgoingCall, endCall]);

  // Control dialog state based on call state (no flicker after reject/end)
  useEffect(() => {
    if (
      incomingCall &&
      incomingCall.status === 'pending' &&
      incomingCall.id !== dismissedCallId
    ) {
      setShowIncomingDialog(true);
      setShowCallDialog(false);
      setCurrentCall(null);
      setIsOutgoing(false);
      setCallError(null);
      return;
    }
    if (incomingCall && incomingCall.status === 'accepted') {
      setCurrentCall(incomingCall);
      setShowCallDialog(true);
      setShowIncomingDialog(false);
      setIsOutgoing(false);
      setDismissedCallId(null);
      setCallError(null);
      return;
    }
    if (outgoingCall && (outgoingCall.status === 'pending' || outgoingCall.status === 'accepted')) {
      setCurrentCall(outgoingCall);
      setShowCallDialog(true);
      setShowIncomingDialog(false);
      setIsOutgoing(true);
      setDismissedCallId(null);
      setCallError(null);
      return;
    }
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
    setShowIncomingDialog(false);
    if (!incomingCall && !outgoingCall) {
      setActiveSessionId(null);
      setCallerName("Someone");
      setRecipientName("Someone");
      setDismissedCallId(null);
    }
  }, [incomingCall, outgoingCall, dismissedCallId]);

  const handleAcceptCall = async (callId: string) => {
    setShowIncomingDialog(false);
    setDismissedCallId(callId); // prevent bounce dialog
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
