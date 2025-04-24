
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const upsertUserPresence = async (userId?: string) => {
  if (!userId) return;
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_presence")
      .upsert(
        {
          user_id: userId,
          last_seen_at: now,
          created_at: now,
        },
        { onConflict: "user_id" }
      );
    if (error) {
      console.error("[Presence][App] Failed to upsert user presence", error);
    } else {
      console.log("[Presence][App] User presence upserted for", userId);
    }
  } catch (err) {
    console.error("[Presence][App] Error upserting presence:", err);
  }
};

export function usePresence(userId: string | null) {
  const updatePresence = useCallback(() => {
    if (userId) {
      upsertUserPresence(userId);
    }
  }, [userId]);

  return { updatePresence };
}
