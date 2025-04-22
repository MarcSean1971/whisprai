
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./MessageList";
import { useState, useCallback } from "react";

interface MessageContentProps {
  messages: any[];
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  refetch?: () => void;
}

export function MessageContent({
  messages,
  userLanguage,
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch
}: MessageContentProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { translatedContents } = useMessageProcessor(
    messages,
    currentUserId,
    userLanguage,
    onNewReceivedMessage,
    onTranslation
  );

  const handleReply = async (content: string) => {
    if (sendReply) {
      const sent = await sendReply(content);
      if (sent && refetch) {
        refetch();
      }
    }
  };

  return (
    <>
      {messages.map((message) => (
        <MessageList
          key={message.id}
          messages={[message]}
          currentUserId={currentUserId}
          profile={{ language: userLanguage }}
          translatedContents={translatedContents}
          onReply={onReply}
          replyToMessageId={replyToMessageId}
        />
      ))}
    </>
  );
}
