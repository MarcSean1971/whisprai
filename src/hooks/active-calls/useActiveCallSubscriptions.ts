
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActiveCall } from "../use-active-calls";
import { handleCallStatusUpdate } from "./handleCallStatusUpdate";

export function useActiveCallSubscriptions(setIncomingCall: (call: ActiveCall | null) => void, setOutgoingCall: (call: ActiveCall | null) => void) {
  useEffect(() => {
    let incomingChannel: any = null;
    let outgoingChannel: any = null;

    const fetchUserIdAndSubscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const userId = data.user.id;

      incomingChannel = supabase
        .channel('incoming-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_calls',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload: any) => {
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
          (payload: any) => {
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, true, setIncomingCall, setOutgoingCall);
            }
          }
        )
        .subscribe();

      outgoingChannel = supabase
        .channel('outgoing-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_calls',
            filter: `caller_id=eq.${userId}`,
          },
          (payload: any) => {
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
          (payload: any) => {
            if (payload.new) {
              handleCallStatusUpdate(payload.new as ActiveCall, false, setIncomingCall, setOutgoingCall);
            }
          }
        )
        .subscribe();
    };

    fetchUserIdAndSubscribe();

    return () => {
      if (incomingChannel) supabase.removeChannel(incomingChannel);
      if (outgoingChannel) supabase.removeChannel(outgoingChannel);
    };
  }, [setIncomingCall, setOutgoingCall]);
}
