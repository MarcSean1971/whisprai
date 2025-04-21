
import { useEffect } from "react";
import { ActiveCall } from "@/hooks/use-active-calls";

export function useCallDialogState({
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
}: {
  incomingCall: ActiveCall | null,
  outgoingCall: ActiveCall | null,
  dismissedCallId: string | null,
  setShowIncomingDialog: (v: boolean) => void,
  setShowCallDialog: (v: boolean) => void,
  setCurrentCall: (v: ActiveCall | null) => void,
  setIsOutgoing: (v: boolean) => void,
  setCallError: (v: string | null) => void,
  setActiveSessionId: (v: string | null) => void,
  setCallerName: (v: string) => void,
  setRecipientName: (v: string) => void,
  setDismissedCallId: (v: string | null) => void,
}) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, outgoingCall, dismissedCallId]);
}
