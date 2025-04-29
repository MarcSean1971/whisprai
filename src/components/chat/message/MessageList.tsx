
import { ChatMessage } from "@/components/ChatMessage";
import { Message } from "@/hooks/use-messages";

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  profile?: { language?: string };
  translatedContents: Record<string, string>;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  scrollToMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  profile,
  translatedContents,
  onReply,
  replyToMessageId,
  scrollToMessage
}: MessageListProps) {
  const handleMessageDelete = () => {
    console.log('Message was deleted, UI will update via React Query cache');
  };

  // Log current user ID to help debug message ownership issues
  console.log('MessageList currentUserId:', currentUserId);
  console.log('MessageList messages count:', messages.length);
  
  // Validate messages array
  if (!Array.isArray(messages)) {
    console.error("Expected messages to be an array but got:", typeof messages);
    return null;
  }
  
  // Don't render messages if we don't have currentUserId yet
  if (currentUserId === null && messages.some(m => m?.sender_id)) {
    console.warn("MessageList: Not rendering messages because currentUserId is null");
    return null;
  }

  return messages.map((message, index) => {
    // Skip invalid message objects
    if (!message || !message.id || !message.content || !message.created_at) {
      console.error("Invalid message structure:", message);
      return null;
    }

    try {
      // Determine if this message is from the current user
      const isOwn = currentUserId !== null && message.sender_id === currentUserId;
      const isAI = message.private_room === 'AI';
      const isAIPrompt = message.content.toLowerCase().startsWith('ai:') || message.content.toLowerCase().startsWith('a:');
      
      console.log(`Message ${message.id} rendering:`, { 
        isOwn, 
        currentUserId, 
        messageSenderId: message.sender_id 
      });
      
      const showSender = !isOwn && !isAI && !isAIPrompt && 
                        (index === 0 || (messages[index - 1] && messages[index - 1].sender_id !== message.sender_id));

      const needsTranslation = !isOwn && 
        !isAI && 
        !isAIPrompt && 
        message.original_language && 
        message.original_language !== profile?.language;

      const translatedContent = needsTranslation ? translatedContents[message.id] : undefined;
      
      // Pass the full timestamp from created_at field
      const timestamp = message.created_at;

      const location = message.metadata?.location ? {
        latitude: message.metadata.location.latitude,
        longitude: message.metadata.location.longitude
      } : undefined;

      // When replying, scroll to parent if exists
      const handleReply = () => {
        onReply(message.id);
        if (message.parent && message.parent.id && scrollToMessage) {
          scrollToMessage(message.parent.id);
        }
      };

      return (
        <ChatMessage
          key={message.id}
          id={message.id}
          content={message.content}
          timestamp={timestamp}
          isOwn={isOwn}
          isAI={isAI || isAIPrompt}
          status={message.status as any}
          sender={message.sender && {
            name: `${message.sender.profiles?.first_name || ''} ${message.sender.profiles?.last_name || ''}`.trim(),
            avatar: message.sender.profiles?.avatar_url,
            language: message.sender.profiles?.language
          }}
          showSender={showSender}
          originalLanguage={message.original_language}
          translatedContent={translatedContent}
          location={location}
          userId={currentUserId}
          conversationId={message.conversation_id}
          onDelete={handleMessageDelete}
          metadata={message.metadata}
          userLanguage={profile?.language}
          onReply={handleReply}
          isReplying={message.id === replyToMessageId}
          parent={message.parent}
          scrollToMessage={scrollToMessage}
        />
      );
    } catch (error) {
      console.error("Error rendering message:", error, message);
      return null;
    }
  }).filter(Boolean);
}
