
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ActiveCall } from "../use-active-calls";

export function useActiveCallActions(setIncomingCall: (call: ActiveCall | null) => void, setOutgoingCall: (call: ActiveCall | null) => void) {
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

  const createCall = async (conversationId: string, recipientId: string, callType: 'vonage' | 'p2p' = 'vonage') => {
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
          status: 'pending',
          call_type: callType
        })
        .select()
        .single();

      if (error) throw error;

      setOutgoingCall(call as ActiveCall);
      return call as ActiveCall;
    } catch (error) {
      toast.error("Failed to initiate call");
      return null;
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

  return {
    createCall,
    acceptCall,
    rejectCall,
    endCall,
    timeoutCall,
  };
}
