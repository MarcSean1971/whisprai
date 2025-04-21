
import { format } from "date-fns";
import { ChatMessage } from "@/components/ChatMessage";
import { Message } from "@/hooks/use-messages";

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  profile?: { language?: string };
  translatedContents: Record<string, string>;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  scrollToMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  profile,
  translatedContents,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  scrollToMessage
}: MessageListProps) {
  const handleMessageDelete = () => {
    console.log('Message was deleted, UI will update via React Query cache');
  };

  return messages.map((message, index) => {
    const isOwn = message.sender_id === currentUserId;
    const isAI = message.private_room === 'AI';
    const isAIPrompt = message.content.toLowerCase().startsWith('ai:') || message.content.toLowerCase().startsWith('a:');
    
    const showSender = !isOwn && !isAI && !isAIPrompt && 
                      (index === 0 || messages[index - 1].sender_id !== message.sender_id);

    const needsTranslation = !isOwn && 
      !isAI && 
      !isAIPrompt && 
      message.original_language && 
      message.original_language !== profile?.language;

    const translatedContent = needsTranslation ? translatedContents[message.id] : undefined;
    const formattedTimestamp = format(new Date(message.created_at), 'HH:mm');

    const location = message.metadata?.location ? {
      latitude: message.metadata.location.latitude,
      longitude: message.metadata.location.longitude
    } : undefined;

    // When replying, scroll to parent if exists
    const handleReply = () => {
      // Only allow one reply input, parent will not trigger nested input
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
        timestamp={formattedTimestamp}
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
  });
}
