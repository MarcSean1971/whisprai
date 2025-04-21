
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

interface OnlineUser {
  user_id: string;
  last_seen_at: string;
}

export function useUserPresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const { profile } = useProfile();
  // Store interval so we can clear it reliably
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    // 1. Check initial status via Supabase client
    const checkInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select('last_seen_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error("[Presence] Failed to fetch initial presence", error);
          setIsOnline(false);
          return;
        }

        if (data && data.last_seen_at) {
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

    return () => {
      // Clean up: clear any presence interval when userId changes/unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only on userId change; presence updater is handled below

  // 2. Handle presence update loop ONLY if this is our own profile
  useEffect(() => {
    // Only run if both loaded and id matches
    if (!userId || !profile || profile.id !== userId) {
      // Clean up any previous interval if we're switching away
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let stopped = false;

    const updateMyPresence = async () => {
      if (stopped) return;
      try {
        const { error } = await supabase
          .from('user_presence')
          .upsert(
            {
              user_id: profile.id,
              last_seen_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        if (error) {
          console.error("[Presence] Failed to update my presence", error);
        } else {
          console.log("[Presence] Updated my presence for user", profile.id);
        }
      } catch (err) {
        console.error("[Presence] Failed to update my presence", err);
      }
    };

    // Immediately update once
    updateMyPresence();

    // Then set interval
    intervalRef.current = setInterval(updateMyPresence, 30_000);

    // Clean up on unmount/profile change
    return () => {
      stopped = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, profile?.id]);

  // 3. Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;
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
    };
  }, [userId]);

  return { isOnline };
}
