
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

interface OnlineUser {
  user_id: string;
  last_seen_at: string;
}

export function useUserPresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    if (!userId) return;

    // 1. Check initial status via REST
    const checkInitialStatus = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${userId}`,
          {
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lastSeen = new Date(data[0].last_seen_at);
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            setIsOnline(lastSeen > twoMinutesAgo);
            console.log(
              "[Presence] User",
              userId,
              "last seen at",
              lastSeen,
              "Online?",
              lastSeen > twoMinutesAgo
            );
          } else {
            setIsOnline(false);
            console.log("[Presence] No presence info found for user", userId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial presence", err);
      }
    };

    checkInitialStatus();

    // 2. If this is our own profile, update our presence every 30s
    let presenceInterval: NodeJS.Timeout | undefined;
    const updateMyPresence = async () => {
      if (!profile || profile.id !== userId) return;
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/user_presence`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: profile.id,
            last_seen_at: new Date().toISOString(),
          }),
        });
        console.log("[Presence] Updated my presence for user", profile.id);
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
          console.log(
            "[Presence] Realtime change for",
            userId,
            "last_seen_at",
            lastSeen,
            "Online?",
            lastSeen > twoMinutesAgo
          );
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
