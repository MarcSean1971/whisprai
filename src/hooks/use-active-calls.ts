
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
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      
      // Subscribe to incoming calls
      const incomingChannel = supabase
        .channel('incoming-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_calls',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          (payload) => {
            console.log("[Call] Received incoming call notification:", payload);
            if (payload.new && payload.new.status === 'pending') {
              setIncomingCall(payload.new as ActiveCall);
            }
          }
        )
        .subscribe();

      // Subscribe to call status updates
      const callStatusChannel = supabase
        .channel('call-status-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_calls',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          (payload) => {
            console.log("[Call] Incoming call status updated:", payload);
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_calls',
            filter: `caller_id=eq.${data.user.id}`,
          },
          (payload) => {
            console.log("[Call] Outgoing call status updated:", payload);
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(incomingChannel);
        supabase.removeChannel(callStatusChannel);
      };
    };

    fetchUserId();
  }, []);

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
    }
  };

  const createCall = async (conversationId: string, recipientId: string) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: call, error } = await supabase
        .from('active_calls')
        .insert({
          conversation_id: conversationId,
          caller_id: user.user.id,
          recipient_id: recipientId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log("[Call] Created outgoing call:", call);
      setOutgoingCall(call as ActiveCall);
      return call as ActiveCall;
    } catch (error) {
      console.error("[Call] Error creating call:", error);
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
      
      console.log("[Call] Accepted call:", callId);
      return true;
    } catch (error) {
      console.error("[Call] Error accepting call:", error);
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
      
      console.log("[Call] Rejected call:", callId);
      setIncomingCall(null);
      return true;
    } catch (error) {
      console.error("[Call] Error rejecting call:", error);
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
      
      console.log("[Call] Ended call:", callId);
      setIncomingCall(null);
      setOutgoingCall(null);
      return true;
    } catch (error) {
      console.error("[Call] Error ending call:", error);
      toast.error("Failed to end call");
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
    endCall
  };
}
