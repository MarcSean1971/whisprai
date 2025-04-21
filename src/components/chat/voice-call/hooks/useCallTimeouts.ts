
import { useEffect, useRef, useState } from "react";
import { ActiveCall } from "@/hooks/use-active-calls";

export function useCallTimeouts({
  incomingCall,
  outgoingCall,
  dismissedCallId,
  timeoutCall,
  endCall,
  setShowIncomingDialog,
  setShowCallDialog,
  setCurrentCall,
  setCallError,
  setDismissedCallId
}: {
  incomingCall: ActiveCall | null,
  outgoingCall: ActiveCall | null,
  dismissedCallId: string | null,
  timeoutCall: (callId: string) => Promise<boolean>,
  endCall: (callId: string) => Promise<boolean>,
  setShowIncomingDialog: (v: boolean) => void,
  setShowCallDialog: (v: boolean) => void,
  setCurrentCall: (call: ActiveCall | null) => void,
  setCallError: (v: string | null) => void,
  setDismissedCallId: (v: string | null) => void
}) {
  const INCOMING_CALL_TIMEOUT = 31000; // 31s
  const OUTGOING_CALL_TIMEOUT = 35000; // 35s
  const [incomingTimeout, setIncomingTimeout] = useState(0);
  const [outgoingTimeout, setOutgoingTimeout] = useState(0);
  const incomingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const outgoingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Incoming timeout logic
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'pending' && incomingCall.id !== dismissedCallId) {
      setShowIncomingDialog(true);
      setShowCallDialog(false);
      setCurrentCall(null);
      setCallError(null);
      setIncomingTimeout(INCOMING_CALL_TIMEOUT / 1000);

      if (incomingTimerRef.current) clearTimeout(incomingTimerRef.current);
      incomingTimerRef.current = setTimeout(async () => {
        setShowIncomingDialog(false);
        setCallError("Missed call: no answer.");
        setDismissedCallId(incomingCall.id);
        await timeoutCall(incomingCall.id);
      }, INCOMING_CALL_TIMEOUT);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, dismissedCallId, timeoutCall]);

  // Outgoing timeout logic
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoingCall, endCall]);

  return { incomingTimeout, outgoingTimeout };
}
