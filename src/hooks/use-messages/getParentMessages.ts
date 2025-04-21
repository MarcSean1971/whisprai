
import { supabase } from "@/integrations/supabase/client";
import { getProfiles } from "./getProfiles";
import type { ParentMessage } from "./types";

/**
 * Fetch parent messages for given parent IDs, attaching sender profiles.
 */
export async function getParentMessages(parentIds: string[]): Promise<Record<string, ParentMessage>> {
  if (!parentIds.length) return {};
  const { data: parentsData } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id")
    .in("id", parentIds);

  if (!parentsData?.length) return {};

  // Get unique senderIds for parents
  const parentSenderIds: string[] = parentsData
    .map((m: any) => m.sender_id)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const parentProfiles = await getProfiles(parentSenderIds);

  return parentsData.reduce((acc, parent: any) => {
    acc[parent.id] = {
      ...parent,
      sender: parent.sender_id
        ? { id: parent.sender_id, profiles: parentProfiles[parent.sender_id] || null }
        : null,
    };
    return acc;
  }, {} as Record<string, ParentMessage>);
}
