
import { useEffect, useState } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { supabase } from "@/integrations/supabase/client";

/**
 * The call manager handles when modals/dialogs are shown for calls.
 */
export function CallManager() {
  const { incomingCall, outgoingCall, acceptCall, rejectCall, endCall } = useActiveCalls();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState("Someone");
  const [recipientName, setRecipientName] = useState("Someone");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [currentCall, setCurrentCall] = useState<ActiveCall | null>(null);
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [showIncomingDialog, setShowIncomingDialog] = useState(false);

  // Extra call debugging
  useEffect(() => {
    if (incomingCall || outgoingCall) {
      console.debug("[CallManager][DEBUG][STATE]", { incomingCall, outgoingCall });
    }
  }, [incomingCall, outgoingCall]);

  // Fetch caller/recipient names when calls change
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
        console.error('Error fetching profile:', error);
        setName('User');
      }
    };

    if (incomingCall) fetchProfileName(incomingCall.caller_id, setCallerName);
    if (outgoingCall) fetchProfileName(outgoingCall.recipient_id, setRecipientName);
  }, [incomingCall, outgoingCall]);

  // Logic to control which dialog is shown based on call state
  useEffect(() => {
    // Show incoming dialog if there's a pending incoming call and no call dialog is open
    if (incomingCall && incomingCall.status === 'pending') {
      setShowIncomingDialog(true);
      setShowCallDialog(false);
      setCurrentCall(null);
      setIsOutgoing(false);
      return;
    }
    // Incoming call has been accepted: show the actual voice call dialog for recipient
    if (incomingCall && incomingCall.status === 'accepted') {
      setCurrentCall(incomingCall);
      setShowCallDialog(true);
      setShowIncomingDialog(false); // hide incoming as we move to call dialog
      setIsOutgoing(false);
      return;
    }
    // Outgoing call created: show the call dialog for caller
    if (outgoingCall && (outgoingCall.status === 'pending' || outgoingCall.status === 'accepted')) {
      setCurrentCall(outgoingCall);
      setShowCallDialog(true);
      setShowIncomingDialog(false);
      setIsOutgoing(true);
      return;
    }
    // If all calls ended/rejected/etc.: clean up
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
    setShowIncomingDialog(false);
    if (!incomingCall && !outgoingCall) {
      setActiveSessionId(null);
      setCallerName("Someone");
      setRecipientName("Someone");
    }
  }, [incomingCall, outgoingCall]);

  const handleAcceptCall = async (callId: string) => {
    setShowIncomingDialog(false); // hide as soon as accepted, let call dialog show up
    const success = await acceptCall(callId);
    return success;
  };

  const handleRejectCall = async (callId: string) => {
    // If user hits reject, hide incoming dialog directly
    setShowIncomingDialog(false);
    await rejectCall(callId);
  };

  // This will be triggered BOTH when user closes dialog and when call ends
  const handleCloseCallDialog = () => {
    if (currentCall) {
      endCall(currentCall.id);
    }
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
  };

  return (
    <>
      {/* Incoming call dialog: displayed only during "pending" */}
      <IncomingCallDialog
        call={showIncomingDialog ? incomingCall : null}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        callerName={callerName}
      />

      {/* Outgoing/active call dialog for both outgoing and accepted cases */}
      {currentCall && showCallDialog && (
        <VoiceCallDialog
          isOpen={showCallDialog}
          onClose={handleCloseCallDialog}
          recipientId={isOutgoing ? currentCall.recipient_id : currentCall.caller_id}
          recipientName={isOutgoing ? recipientName : callerName}
          conversationId={currentCall.conversation_id}
          callStatus={currentCall.status}
        />
      )}
    </>
  );
}

