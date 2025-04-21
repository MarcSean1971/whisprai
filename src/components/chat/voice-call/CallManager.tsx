
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

  // CRITICAL CALL DIALOG LOGIC
  useEffect(() => {
    // Important: outgoingCall.status 'pending' or 'accepted' should always show call dialog!
    // Priority: show dialog for outgoing, unless there is a connected incoming
    if (incomingCall && incomingCall.status === 'accepted') {
      setCurrentCall(incomingCall);
      setShowCallDialog(true);
      setIsOutgoing(false);
      console.debug("[CallManager][DEBUG] Showing dialog for accepted incoming call");
      return;
    }
    if (outgoingCall && (outgoingCall.status === 'pending' || outgoingCall.status === 'accepted')) {
      setCurrentCall(outgoingCall);
      setShowCallDialog(true);
      setIsOutgoing(true);
      console.debug("[CallManager][DEBUG] Showing dialog for outgoing call (pending/accepted)", outgoingCall);
      return;
    }
    // Handle the case where call ends (reset all state)
    setShowCallDialog(false);
    setCurrentCall(null);
    setIsOutgoing(false);
    if (!incomingCall && !outgoingCall) {
      setActiveSessionId(null);
      setCallerName("Someone");
      setRecipientName("Someone");
    }
  }, [incomingCall, outgoingCall]);

  const handleAcceptCall = async (callId: string) => {
    const success = await acceptCall(callId);
    return success;
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
      {/* Incoming call dialog */}
      <IncomingCallDialog
        call={incomingCall?.status === 'pending' ? incomingCall : null}
        onAccept={handleAcceptCall}
        onReject={rejectCall}
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
