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

      // --- Real-time: Incoming calls (where I'm the recipient) ---
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
            // Incoming call notification for recipient
            console.log("[Call][Realtime] Received incoming call INSERT:", payload);
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
            // Incoming call status update for recipient
            console.log("[Call][Realtime] Incoming call UPDATE:", payload);
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, true);
            }
          }
        )
        .subscribe();

      // --- Real-time: Outgoing calls (where I'm the caller) ---
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
            // Outgoing call INSERT for caller -- show "calling..." immediately
            console.log("[Call][Realtime] Outgoing call INSERT:", payload);
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
            // Outgoing call status change for caller
            console.log("[Call][Realtime] Outgoing call UPDATE:", payload);
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, false);
            }
          }
        )
        .subscribe();

      // Clean up all subscriptions
      return () => {
        supabase.removeChannel(incomingChannel);
        supabase.removeChannel(outgoingChannel);
      };
    };

    fetchUserIdAndSubscribe();
  }, []);

  // Update call state based on new data
  const handleCallStatusUpdate = (call: ActiveCall, isIncoming: boolean) => {
    console.log("[Call][StatusUpdate]", call, "isIncoming?", isIncoming);
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
      // For outgoing calls, keep updated with possible participant/session_id updates
      if (!isIncoming) {
        setOutgoingCall(call);
      }
    }
  };

  // --- Outgoing call: create ---
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

      console.log("[Call][Create] Created outgoing call:", call);
      setOutgoingCall(call as ActiveCall);
      return call as ActiveCall;
    } catch (error) {
      console.error("[Call][Create] Error creating call:", error);
      toast.error("Failed to initiate call");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // --- Accept call (as recipient) ---
  const acceptCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'accepted' })
        .eq('id', callId);

      if (error) throw error;

      console.log("[Call][Accept] Accepted call:", callId);
      return true;
    } catch (error) {
      console.error("[Call][Accept] Error accepting call:", error);
      toast.error("Failed to accept call");
      return false;
    }
  };

  // --- Reject call (as recipient) ---
  const rejectCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'rejected' })
        .eq('id', callId);

      if (error) throw error;

      console.log("[Call][Reject] Rejected call:", callId);
      setIncomingCall(null);
      return true;
    } catch (error) {
      console.error("[Call][Reject] Error rejecting call:", error);
      toast.error("Failed to reject call");
      return false;
    }
  };

  // --- End call (as either) ---
  const endCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'ended' })
        .eq('id', callId);

      if (error) throw error;

      console.log("[Call][End] Ended call:", callId);
      setIncomingCall(null);
      setOutgoingCall(null);
      return true;
    } catch (error) {
      console.error("[Call][End] Error ending call:", error);
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
