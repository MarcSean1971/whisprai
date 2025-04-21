
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

interface OnlineUser {
  id: string;
  last_seen_at: string;
}

export function useUserPresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const { profile } = useProfile();
  
  useEffect(() => {
    if (!userId || !profile) return;
    
    // First check the current status
    const checkInitialStatus = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('last_seen_at')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        // Consider online if seen in the last 2 minutes
        const lastSeen = new Date(data.last_seen_at);
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        setIsOnline(lastSeen > twoMinutesAgo);
      }
    };
    
    checkInitialStatus();
    
    // Update our own presence
    const updateMyPresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: profile.id,
          last_seen_at: new Date().toISOString()
        });
    };
    
    // Update presence immediately and every 30 seconds
    updateMyPresence();
    const presenceInterval = setInterval(updateMyPresence, 30000);
    
    // Subscribe to realtime changes for the specific user
    const channel = supabase
      .channel(`presence_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const userData = payload.new as OnlineUser;
          const lastSeen = new Date(userData.last_seen_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          setIsOnline(lastSeen > twoMinutesAgo);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceInterval);
    };
  }, [userId, profile]);
  
  return { isOnline };
}
