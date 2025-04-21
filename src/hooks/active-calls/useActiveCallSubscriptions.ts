
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActiveCall } from "../use-active-calls";
import { handleCallStatusUpdate } from "./handleCallStatusUpdate";
import { useProfile } from "@/hooks/use-profile";
import { useUserPresence } from "@/hooks/use-user-presence";

export function useActiveCallSubscriptions(setIncomingCall: (call: ActiveCall | null) => void, setOutgoingCall: (call: ActiveCall | null) => void) {
  const { profile } = useProfile();
  const { refreshPresence } = useUserPresence(profile?.id);

  useEffect(() => {
    let incomingChannel: any = null;
    let outgoingChannel: any = null;

    const fetchUserIdAndSubscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const userId = data.user.id;

      // When subscribing to calls, refresh our presence first
      refreshPresence();

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
          async (payload: any) => {
            if (payload.new && payload.new.status === 'pending') {
              console.log("[ActiveCalls] Received new incoming call:", payload.new);
              // Refresh presence when we receive a call
              await refreshPresence();
              
              // Force update of caller's presence - make a direct check
              try {
                const { data: callerPresence } = await supabase
                  .from('user_presence')
                  .select('*')
                  .eq('user_id', payload.new.caller_id)
                  .single();
                  
                console.log("[ActiveCalls] Caller presence:", callerPresence);
              } catch (err) {
                console.error("[ActiveCalls] Error checking caller presence:", err);
              }
              
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
              console.log("[ActiveCalls] Incoming call status updated:", payload.new);
              refreshPresence();
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
              console.log("[ActiveCalls] Created new outgoing call:", payload.new);
              // Refresh presence when making a call
              refreshPresence();
              
              // Check recipient presence
              try {
                supabase
                  .from('user_presence')
                  .select('*')
                  .eq('user_id', payload.new.recipient_id)
                  .single()
                  .then(({ data }) => {
                    console.log("[ActiveCalls] Recipient presence:", data);
                  });
              } catch (err) {
                console.error("[ActiveCalls] Error checking recipient presence:", err);
              }
              
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
              console.log("[ActiveCalls] Outgoing call status updated:", payload.new);
              refreshPresence();
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
  }, [setIncomingCall, setOutgoingCall, refreshPresence]);
}
