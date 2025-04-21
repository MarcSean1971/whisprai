
import { useState } from "react";

// Cleaned-up type definition for active_calls (no Vonage/simple-peer columns)
export interface ActiveCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  created_at: string;
  updated_at: string;
}

export function useActiveCalls() {
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // No arguments, as reflected in ChatHeader usage
  return {
    incomingCall,
    outgoingCall,
    isLoading,
    createCall: async () => null,
    acceptCall: async () => false,
    rejectCall: async () => false,
    endCall: async () => false,
    timeoutCall: async () => false,
  };
}
