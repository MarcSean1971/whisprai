
import { useState } from "react";

// Basic version with only the type definition
export interface ActiveCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  created_at: string;
  updated_at: string;
}

// Empty hook that will be reimplemented later without Vonage
export function useActiveCalls() {
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
