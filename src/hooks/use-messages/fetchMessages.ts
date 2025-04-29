
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProfiles } from "./getProfiles";
import { getParentMessages } from "./getParentMessages";
import type { Message } from "./types";

export interface FetchMessagesResponse {
  messages: Message[];
  nextCursor?: string;
}

export async function fetchMessages(
  conversationId: string,
  pageSize: number = 20,
  cursor?: string
): Promise<FetchMessagesResponse> {
  console.log('Fetching messages:', { conversationId, pageSize, cursor });
  
  if (!conversationId) throw new Error("No conversation ID provided");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated when fetching messages");
    throw new Error("User not authenticated");
  }
  
  console.log('Current user ID for message filtering:', user.id);

  // Start building the query
  let query = supabase
    .from("messages")
    .select("*, parent_id")
    .eq("conversation_id", conversationId);
  
  // Fix: Use proper query structure with separate or conditions
  query = query.or('private_room.is.null');
  
  // Only add user filters if we have a user ID
  if (user.id) {
    try {
      query = query.or(
        `and(private_room.eq.AI,or(sender_id.eq.${user.id},private_recipient.eq.${user.id}))`
      );
    } catch (err) {
      console.error("Error adding user filtering:", err);
      // Fallback to just showing public messages if the filter fails
    }
  }
  
  // Add pagination
  query = query.order("created_at", { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  console.log('Executing messages query');
  const { data: messages, error: messagesError } = await query;

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    toast.error("Failed to load messages: " + messagesError.message);
    throw messagesError;
  }

  if (!messages) {
    console.warn("No messages returned from query");
    return { messages: [] };
  }

  console.log(`Fetched ${messages.length} messages`);

  // Get the next cursor from the oldest message
  const nextCursor = messages.length === pageSize ? 
    messages[messages.length - 1].created_at : 
    undefined;

  // Fetch user profiles for message senders
  const senderIds: string[] = messages
    .map((m: any) => m.sender_id)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Fetch parent messages for replies
  const parentIds: string[] = messages
    .map((m: any) => m.parent_id)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  console.log('Fetching supplementary data:', {
    uniqueSenderIds: senderIds.length,
    uniqueParentIds: parentIds.length
  });

  let profiles = {};
  let parentMessages = {};
  
  try {
    profiles = await getProfiles(senderIds);
  } catch (err) {
    console.error("Error fetching profiles:", err);
  }
  
  try {
    parentMessages = await getParentMessages(parentIds);
  } catch (err) {
    console.error("Error fetching parent messages:", err);
  }

  // Format result as array of Message and reverse to display correctly
  const formattedMessages = messages
    .map((message: any) => {
      if (!message.id || !message.content || !message.created_at || !message.conversation_id) {
        console.error("Invalid message structure:", message);
        return null;
      }
      
      const isOwnMessage = message.sender_id === user.id;
      
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

  console.log('Returning formatted messages:', {
    count: formattedMessages.length,
    nextCursor,
    oldestMessageDate: formattedMessages.length > 0 ? 
      formattedMessages[formattedMessages.length - 1]?.created_at : 'no messages'
  });

  return { 
    messages: formattedMessages,
    nextCursor 
  };
}
