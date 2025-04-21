
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

interface OnlineUser {
  user_id: string;
  last_seen_at: string;
}

export function useUserPresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    if (!userId) return;

    // 1. Check initial status via Supabase client
    const checkInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select('last_seen_at')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error("[Presence] Failed to fetch initial presence", error);
          setIsOnline(false);
          return;
        }

        if (data) {
          const lastSeen = new Date(data.last_seen_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          setIsOnline(lastSeen > twoMinutesAgo);
          console.log("[Presence] User", userId, "last seen at", lastSeen, "Online?", lastSeen > twoMinutesAgo);
        } else {
          setIsOnline(false);
          console.log("[Presence] No presence info found for user", userId);
        }
      } catch (err) {
        console.error("[Presence] Failed to fetch initial presence", err);
        setIsOnline(false);
      }
    };

    checkInitialStatus();

    // 2. If this is our own profile, update our presence every 30s
    let presenceInterval: NodeJS.Timeout | undefined;
    const updateMyPresence = async () => {
      if (!profile || profile.id !== userId) return;
      try {
        // Use upsert by inserting with onConflict
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: profile.id,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) {
          console.error("[Presence] Failed to update my presence", error);
        } else {
          console.log("[Presence] Updated my presence for user", profile.id);
        }
      } catch (err) {
        console.error("[Presence] Failed to update my presence", err);
      }
    };

    if (profile && profile.id === userId) {
      updateMyPresence();
      presenceInterval = setInterval(updateMyPresence, 30000);
    }

    // 3. Subscribe to realtime changes
    const channel = supabase
      .channel(`presence_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const userData = payload.new as OnlineUser;
          const lastSeen = new Date(userData.last_seen_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          setIsOnline(lastSeen > twoMinutesAgo);
          console.log("[Presence] Realtime change for", userId, "last_seen_at", lastSeen, "Online?", lastSeen > twoMinutesAgo);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, [userId, profile]);

  return { isOnline };
}
