
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./types";

/**
 * Fetch profiles for an array of user IDs.
 */
export async function getProfiles(ids: string[]): Promise<Record<string, Profile>> {
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, language")
    .in("id", ids);

  if (error) {
    console.error("Error fetching profiles:", error);
    return {};
  }

  return (data || []).reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, Profile>);
}
