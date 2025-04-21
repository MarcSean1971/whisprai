
import React from "react";
import { ActiveCall } from "@/hooks/use-active-calls";

interface CallHandlersProps {
  incomingCall: ActiveCall | null;
  outgoingCall: ActiveCall | null;
  acceptCall: (callId: string) => Promise<boolean>;
  rejectCall: (callId: string) => Promise<boolean>;
  endCall: (callId: string) => Promise<boolean>;
  setShowIncomingDialog: (v: boolean) => void;
  setDismissedCallId: (v: string | null) => void;
  setCallError: (v: string | null) => void;
  setShowCallDialog: (v: boolean) => void;
  setCurrentCall: (call: ActiveCall | null) => void;
  setIsOutgoing: (v: boolean) => void;
  currentCall: ActiveCall | null;
}

export function useCallHandlers({
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
  currentCall
}: CallHandlersProps) {
  const handleAcceptCall = React.useCallback(async (callId: string) => {
    setShowIncomingDialog(false);
    setDismissedCallId(callId);
    setCallError(null);
    return await acceptCall(callId);
  }, [acceptCall, setShowIncomingDialog, setDismissedCallId, setCallError]);

  const handleRejectCall = React.useCallback(async (callId: string) => {
    setShowIncomingDialog(false);
    setDismissedCallId(callId);
    setCallError("Call declined.");
    await rejectCall(callId);
    return true;
  }, [rejectCall, setShowIncomingDialog, setDismissedCallId, setCallError]);

  const handleCloseCallDialog = React.useCallback(() => {
    if (currentCall) {
      endCall(currentCall.id);
      setDismissedCallId(currentCall.id);
      setCallError("Call ended.");
    }
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
  }, [currentCall, endCall, setDismissedCallId, setCallError, setShowCallDialog, setCurrentCall, setIsOutgoing]);

  return { handleAcceptCall, handleRejectCall, handleCloseCallDialog };
}
