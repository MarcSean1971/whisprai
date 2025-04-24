
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./MessageList";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle } from "lucide-react";
import { MessageReplyInput } from "./MessageReplyInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, useState, useCallback } from "react";

interface TranslationConsumerProps {
  messages: any[];
  currentUserId: string | null;
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  refetch?: () => void;
  messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  scrollToMessage: (messageId: string) => void;
  forceScroll?: boolean;
}

export function TranslationConsumer({
  messages,
  currentUserId,
  userLanguage,
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch,
  messageRefs,
  scrollToMessage,
  forceScroll
}: TranslationConsumerProps) {
  const { translatedContents } = useMessageProcessor(
    messages,
    currentUserId,
    userLanguage,
    onNewReceivedMessage,
    onTranslation
  );

  const [processedMessages, setProcessedMessages] = useState(messages);

  useEffect(() => {
    setProcessedMessages(messages);
  }, [messages]);

  const shouldShowReplyInput = useCallback((message: any) => {
    if (replyToMessageId !== message.id) return false;
    const target = messages.find((m: any) => m.id === replyToMessageId);
    if (target && target.parent && target.parent.id) {
      return !messages.some((m: any) => m.id === target.parent.id);
    }
    return true;
  }, [replyToMessageId, messages]);

  if (!Array.isArray(processedMessages) || processedMessages.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
        title="No messages yet"
        description="Start a conversation by sending a message below."
      />
    );
  }

  return (
    <>
      {processedMessages.map((message) => {
        if (!message || !message.id) {
          console.error('Invalid message object:', message);
          return null;
        }
        
        return (
          <div
            key={message.id}
            ref={el => {
              messageRefs.current[message.id] = el;
            }}
          >
            <ErrorBoundary>
              <MessageList
                messages={[message]}
                currentUserId={currentUserId}
                profile={{ language: userLanguage }}
                translatedContents={translatedContents}
                onReply={onReply}
                replyToMessageId={replyToMessageId}
                scrollToMessage={scrollToMessage}
              />
            </ErrorBoundary>
            {sendReply && cancelReply && shouldShowReplyInput(message) && (
              <div className="ml-10 mb-4">
                <MessageReplyInput
                  onSubmit={async (content: string) => {
                    const sent = await sendReply(content);
                    if (sent && refetch) {
                      refetch();
                    }
                  }}
                  onCancel={cancelReply}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
