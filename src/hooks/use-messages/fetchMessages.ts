
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
  if (!user) throw new Error("User not authenticated");
  
  console.log('Current user ID for message ownership:', user.id);

  // Start building the query
  let query = supabase
    .from("messages")
    .select("*, parent_id")
    .eq("conversation_id", conversationId);
  
  // Handle private room filtering with properly structured query builder method
  query = query.or([
    'private_room.is.null',
    {
      and: [
        { private_room: 'AI' },
        {
          or: [
            { sender_id: user.id },
            { private_recipient: user.id }
          ]
        }
      ]
    }
  ] as any); // Type assertion to bypass TypeScript issue
  
  // Add pagination
  query = query.order("created_at", { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: messages, error: messagesError } = await query;

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    toast.error("Failed to load messages");
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

  // Format result as array of Message and reverse to display correctly
  const formattedMessages = messages
    .map((message: any) => {
      if (!message.id || !message.content || !message.created_at || !message.conversation_id) {
        console.error("Invalid message structure:", message);
        return null;
      }
      
      const isOwnMessage = message.sender_id === user.id;
      console.log(`Message ${message.id} ownership:`, { 
        isOwn: isOwnMessage,
        messageSenderId: message.sender_id,
        currentUserId: user.id 
      });
      
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
    oldestMessageDate: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1]?.created_at : 'no messages',
    firstMessageSenderId: formattedMessages.length > 0 ? formattedMessages[0]?.sender_id : 'no messages'
  });

  return { 
    messages: formattedMessages,
    nextCursor 
  };
}
