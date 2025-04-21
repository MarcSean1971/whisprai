
import { useEffect, useState } from "react";
import { useActiveCalls, ActiveCall } from "@/hooks/use-active-calls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { VoiceCallDialog } from "./VoiceCallDialog";
import { supabase } from "@/integrations/supabase/client";

export function CallManager() {
  const { incomingCall, outgoingCall, acceptCall, rejectCall, endCall } = useActiveCalls();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState("Someone");
  const [recipientName, setRecipientName] = useState("Someone");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [currentCall, setCurrentCall] = useState<ActiveCall | null>(null);
  const [isOutgoing, setIsOutgoing] = useState(false);

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

    if (incomingCall) {
      fetchProfileName(incomingCall.caller_id, setCallerName);
    }
    
    if (outgoingCall) {
      fetchProfileName(outgoingCall.recipient_id, setRecipientName);
    }
  }, [incomingCall, outgoingCall]);

  // Handle active call states
  useEffect(() => {
    if (incomingCall?.status === 'accepted') {
      // Accepted incoming call
      setCurrentCall(incomingCall);
      setShowCallDialog(true);
      setIsOutgoing(false);
    } else if (outgoingCall) {
      // Handle outgoing call
      setCurrentCall(outgoingCall);
      setShowCallDialog(true);
      setIsOutgoing(true);
    } else {
      // No active calls
      setShowCallDialog(false);
      setCurrentCall(null);
    }
  }, [incomingCall, outgoingCall]);

  const handleAcceptCall = async (callId: string) => {
    const success = await acceptCall(callId);
    return success;
  };

  const handleCloseCallDialog = () => {
    if (currentCall) {
      endCall(currentCall.id);
    }
    setShowCallDialog(false);
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

      {/* Active call dialog */}
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
