
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./MessageList";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle } from "lucide-react";
import { MessageReplyInput } from "./MessageReplyInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { memo, useEffect, useMemo, useCallback } from "react";

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
}

export const TranslationConsumer = memo(function TranslationConsumer({
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
  scrollToMessage
}: TranslationConsumerProps) {
  const { translatedContents } = useMessageProcessor(
    messages,
    currentUserId,
    userLanguage,
    onNewReceivedMessage,
    onTranslation
  );

  // Log current user ID to help debug message ownership issues
  useEffect(() => {
    if (messages.length > 0 || currentUserId === null) {
      console.log('TranslationConsumer state:', {
        currentUserId,
        messagesCount: messages.length,
        firstSenderId: messages[0]?.sender_id,
        lastSenderId: messages[messages.length-1]?.sender_id
      });
    }
  }, [currentUserId, messages]);

  // Early guard: if userId is null, show the warning
  if (currentUserId === null) {
    console.error("TranslationConsumer: currentUserId is null, cannot render messages properly");
    return (
      <div>
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="User information missing"
          description="Please try refreshing the page."
        />
      </div>
    );
  }

  // Group messages by id to ensure we don't process the same message twice
  const messagesById = useMemo(() => {
    const msgMap: Record<string, any> = {};
    if (Array.isArray(messages)) {
      messages.forEach(message => {
        if (message && message.id) {
          msgMap[message.id] = message;
        }
      });
    }
    return msgMap;
  }, [messages]);

  const shouldShowReplyInput = useCallback((messageId: string) => {
    if (replyToMessageId !== messageId) return false;
    
    // Find the target message
    const target = messages.find((m: any) => m.id === replyToMessageId);
    if (!target) return false;
    
    // Check if it has a parent that's visible
    if (target.parent && target.parent.id) {
      const parentIsVisible = messages.some((m: any) => m.id === target.parent.id);
      if (parentIsVisible) return false;
    }
    
    return true;
  }, [replyToMessageId, messages]);

  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div>
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
          title="No messages yet"
          description="Start a conversation by sending a message below."
        />
      </div>
    );
  }

  return (
    <>
      {Object.values(messagesById).map((message) => {
        if (!message || !message.id) {
          console.error('Invalid message object:', message);
          return null;
        }
        
        return (
          <div key={message.id}>
            <ErrorBoundary>
              <div ref={el => {
                messageRefs.current[message.id] = el;
              }}>
                <MessageList
                  messages={[message]}
                  currentUserId={currentUserId}
                  profile={{ language: userLanguage }}
                  translatedContents={translatedContents}
                  onReply={onReply}
                  replyToMessageId={replyToMessageId}
                  scrollToMessage={scrollToMessage}
                />
              </div>
              {sendReply && cancelReply && shouldShowReplyInput(message.id) && (
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
            </ErrorBoundary>
          </div>
        );
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom memoization to avoid unnecessary re-renders
  return (
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.replyToMessageId === nextProps.replyToMessageId &&
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.userLanguage === nextProps.userLanguage
  );
});
