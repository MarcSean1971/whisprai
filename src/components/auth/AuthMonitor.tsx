
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { upsertUserPresence } from "@/hooks/use-presence";

interface AuthMonitorProps {
  onUserIdChange: (userId: string | null) => void;
  onInitComplete: () => void;
}

export function AuthMonitor({ onUserIdChange, onInitComplete }: AuthMonitorProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || null;
        onUserIdChange(uid);
        if (uid) {
          upsertUserPresence(uid);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Error initializing session');
      } finally {
        onInitComplete();
      }
    };

    fetchUserId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...');
        onUserIdChange(null);
        queryClient.clear();
        window.location.href = '/auth';
      } else if (event === 'SIGNED_IN') {
        const uid = session?.user?.id || null;
        onUserIdChange(uid);
        if (uid) {
          upsertUserPresence(uid);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onUserIdChange, onInitComplete, queryClient]);

  return null;
}
