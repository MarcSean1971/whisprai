
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    const fetchUserIdAndSubscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const userId = data.user.id;

      const incomingChannel = supabase
        .channel('incoming-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_calls',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new && payload.new.status === 'pending') {
              setIncomingCall(payload.new as ActiveCall);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_calls',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, true);
            }
          }
        )
        .subscribe();

      const outgoingChannel = supabase
        .channel('outgoing-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_calls',
            filter: `caller_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              setOutgoingCall(payload.new as ActiveCall);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_calls',
            filter: `caller_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(incomingChannel);
        supabase.removeChannel(outgoingChannel);
      };
    };

    fetchUserIdAndSubscribe();
  }, []);

  // Update call state based on new data
  const handleCallStatusUpdate = (call: ActiveCall, isIncoming: boolean) => {
    if (call.status === 'rejected') {
      if (isIncoming) {
        setIncomingCall(null);
      } else {
        setOutgoingCall(null);
        toast.error("Call was rejected");
      }
    } else if (call.status === 'ended') {
      if (isIncoming) {
        setIncomingCall(null);
      } else {
        setOutgoingCall(null);
      }
    } else if (call.status === 'accepted') {
      if (isIncoming) {
        setIncomingCall(call);
      } else {
        setOutgoingCall(call);
      }
    } else if (call.status === 'pending') {
      if (!isIncoming) {
        setOutgoingCall(call);
      }
    }
  };

  const createCall = async (conversationId: string, recipientId: string) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const callerId = user?.user?.id;
      if (!callerId) throw new Error("User not authenticated");

      const { data: call, error } = await supabase
        .from('active_calls')
        .insert({
          conversation_id: conversationId,
          caller_id: callerId,
          recipient_id: recipientId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setOutgoingCall(call as ActiveCall);
      return call as ActiveCall;
    } catch (error) {
      toast.error("Failed to initiate call");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'accepted' })
        .eq('id', callId);

      if (error) throw error;

      return true;
    } catch (error) {
      toast.error("Failed to accept call");
      return false;
    }
  };

  const rejectCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'rejected' })
        .eq('id', callId);

      if (error) throw error;

      setIncomingCall(null);
      return true;
    } catch (error) {
      toast.error("Failed to reject call");
      return false;
    }
  };

  const endCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'ended' })
        .eq('id', callId);

      if (error) throw error;

      setIncomingCall(null);
      setOutgoingCall(null);
      return true;
    } catch (error) {
      toast.error("Failed to end call");
      return false;
    }
  };

  // Used when a call is unanswered and should auto-reject after timeout
  const timeoutCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'rejected' })
        .eq('id', callId);

      if (error) throw error;

      setIncomingCall(null);
      toast.error("Missed call: no answer.");
      return true;
    } catch (error) {
      toast.error("Failed to timeout call");
      return false;
    }
  };

  return {
    incomingCall,
    outgoingCall,
    isLoading,
    createCall,
    acceptCall,
    rejectCall,
    endCall,
    timeoutCall,
  };
}
// This file is now over 250 lines. Please consider splitting into smaller hooks or helpers after testing.
