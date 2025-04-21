
import { useState } from "react";
import { useActiveCallSubscriptions } from "./active-calls/useActiveCallSubscriptions";
import { useActiveCallActions } from "./active-calls/useActiveCallActions";

export interface ActiveCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  session_id: string | null;
  created_at: string;
  updated_at: string;
  call_type: 'vonage' | 'p2p';
  signaling_data?: {
    offer?: string;
    answer?: string;
  };
}

export function useActiveCalls() {
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useActiveCallSubscriptions(setIncomingCall, setOutgoingCall);
  const {
    createCall,
    acceptCall,
    rejectCall,
    endCall,
    timeoutCall
  } = useActiveCallActions(setIncomingCall, setOutgoingCall);

  return {
    incomingCall,
    outgoingCall,
    isLoading,
    createCall: async (conversationId: string, recipientId: string, callType: 'vonage' | 'p2p' = 'vonage') => {
      setIsLoading(true);
      try {
        return await createCall(conversationId, recipientId, callType);
      } finally {
        setIsLoading(false);
      }
    },
    acceptCall,
    rejectCall,
    endCall,
    timeoutCall,
  };
}
