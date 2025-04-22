
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProfiles } from "./getProfiles";
import { getParentMessages } from "./getParentMessages";
import type { Message } from "./types";

/**
 * Fetches messages for a conversation and enriches them with sender and parent profiles.
 */
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (!conversationId) throw new Error("No conversation ID provided");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*, parent_id")
    .eq("conversation_id", conversationId)
    .or(
      `private_room.is.null,and(private_room.eq.AI,or(sender_id.eq.${user.id},private_recipient.eq.${user.id}))`
    )
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    toast.error("Failed to load messages");
    throw messagesError;
  }
  if (!messages) {
    console.warn("No messages returned from query");
    return [];
  }
  // Fetch user profiles
  const senderIds: string[] = messages
    .map((m: any) => m.sender_id)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const profiles = await getProfiles(senderIds);

  // Fetch parent messages
  const parentIds: string[] = messages
    .map((m: any) => m.parent_id)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const parentMessages = await getParentMessages(parentIds);

  // Format result as array of Message
  return messages
    .map((message: any) => {
      if (!message.id || !message.content || !message.created_at || !message.conversation_id) {
        console.error("Invalid message structure:", message);
        return null;
      }
      return {
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        status: message.status || "sent",
        original_language: message.original_language,
        metadata: message.metadata,
        private_room: message.private_room,
        private_recipient: message.private_recipient,
        sender: message.sender_id
          ? {
              id: message.sender_id,
              profiles: profiles[message.sender_id] || {},
            }
          : undefined,
        parent:
          message.parent_id && parentMessages[message.parent_id]
            ? {
                id: parentMessages[message.parent_id].id,
                content: parentMessages[message.parent_id].content,
                created_at: parentMessages[message.parent_id].created_at,
                sender: parentMessages[message.parent_id].sender,
              }
            : null,
      } as Message;
    })
    .filter(Boolean) as Message[];
}
