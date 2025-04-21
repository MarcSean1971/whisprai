
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

    // 1. Check initial status via Supabase client, and upsert immediately for own user
    const checkAndUpsertPresence = async () => {
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
          // CHANGE: Increased from 2 to 5 minutes for presence timeout
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          setIsOnline(lastSeen > fiveMinutesAgo);

          console.log("[Presence] [CHECK] User", userId, "last_seen_at", lastSeen, "| 5 minutes ago:", fiveMinutesAgo, "| Online?", lastSeen > fiveMinutesAgo);
        } else {
          setIsOnline(false);
          console.log("[Presence] No presence info found for user", userId);
        }

        // If this is ourselves, and there's no row, upsert presence now (so a row always exists)
        // (This is safe even if it exists, thanks to upsert)
        if (profile && profile.id === userId) {
          const now = new Date().toISOString();
          const { error: upsertError } = await supabase
            .from("user_presence")
            .upsert(
              {
                user_id: profile.id,
                last_seen_at: now,
                created_at: now,
              },
              { onConflict: "user_id" }
            );
          if (upsertError) {
            console.error("[Presence] Immediate upsert failed", upsertError);
          } else {
            console.log("[Presence] Initial upsert after mount for", userId);
          }
        }
      } catch (err) {
        console.error("[Presence] Failed to fetch initial presence", err);
        setIsOnline(false);
      }
    };

    checkAndUpsertPresence();

    // --- ADDED: "refocus"/visibility upsert for ourselves ---
    let visibilityHandler: (() => void) | null = null;
    if (profile && profile.id === userId) {
      visibilityHandler = async () => {
        if (document.visibilityState === "visible" || document.hasFocus()) {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from("user_presence")
            .upsert(
              {
                user_id: profile.id,
                last_seen_at: now,
                created_at: now,
              },
              { onConflict: "user_id" }
            );
          if (error) {
            console.error("[Presence] Upsert on visibilitychange/focus failed:", error);
          } else {
            console.log("[Presence] Upsert after visibilitychange/focus for", profile.id, now);
          }
        }
      };
      window.addEventListener("visibilitychange", visibilityHandler);
      window.addEventListener("focus", visibilityHandler);
    }

    return () => {
      // Clean up: clear any presence interval when userId changes/unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (visibilityHandler) {
        window.removeEventListener("visibilitychange", visibilityHandler);
        window.removeEventListener("focus", visibilityHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile?.id]); // re-run if user or profile changes

  // Handle regular presence heartbeat ONLY if this is our own profile
  useEffect(() => {
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
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('user_presence')
          .upsert(
            {
              user_id: profile.id,
              last_seen_at: now,
              created_at: now,
            },
            { onConflict: 'user_id' }
          );
        if (error) {
          console.error("[Presence] Failed to update my presence", error);
        } else {
          // Only log occasionally to avoid spam. Remove/comment as desired.
          // console.log("[Presence] Updated my presence for user", profile.id);
        }
      } catch (err) {
        console.error("[Presence] Failed to update my presence", err);
      }
    };

    updateMyPresence(); // Immediately update once on load

    // CHANGE: Decrease interval from 30s to 20s for more frequent updates
    intervalRef.current = setInterval(updateMyPresence, 20_000);

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
          // CHANGE: Increased from 2 to 5 minutes for presence timeout
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          setIsOnline(lastSeen > fiveMinutesAgo);
          console.log("[Presence] [REALTIME] change", userId, "last_seen_at", lastSeen, "| Online?", lastSeen > fiveMinutesAgo);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Add a new function to explicitly update presence, useful for manual triggering
  const refreshPresence = async (): Promise<boolean> => {
    if (!profile?.id) return false;
    
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('user_presence')
        .upsert(
          {
            user_id: profile.id,
            last_seen_at: now,
            created_at: now,
          },
          { onConflict: 'user_id' }
        );
      
      if (error) {
        console.error("[Presence] Manual refresh failed", error);
        return false;
      }
      
      console.log("[Presence] Manual refresh successful for", profile.id);
      return true;
    } catch (err) {
      console.error("[Presence] Manual refresh error", err);
      return false;
    }
  };

  return { isOnline, refreshPresence };
}
