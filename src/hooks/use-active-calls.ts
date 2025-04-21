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

  // `isLoading` is still updated in createCall only for outgoing case, but could be improved in future.

  return {
    incomingCall,
    outgoingCall,
    isLoading,
    createCall: async (...args: Parameters<typeof createCall>) => {
      setIsLoading(true);
      try {
        return await createCall(...args);
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
// This file is now small. The subscriptions, actions, and call status update logic are all delegated to focused files.
