import { useState } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { MessageReplyInput } from "./message/MessageReplyInput";
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { LoadingMessages } from "./message/LoadingMessages";
import { MessageUserAuth } from "./message/MessageUserAuth";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  refetch?: () => void;
  isFetchingNextPage?: boolean;
}

export function ChatMessages({ 
  messages = [], 
  userLanguage = 'en',
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch,
  isFetchingNextPage
}: ChatMessagesProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { scrollContainerRef, loadMoreRef, messagesEndRef } = useMessageScroll({
    messages,
    refetch
  });

  const scrollToMessage = (messageId: string) => {
    const ref = messageRefs.current[messageId];
    if (ref && typeof ref.scrollIntoView === "function") {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (error) {
    return (
      <div className="absolute inset-0 overflow-y-auto flex items-center justify-center">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="Error loading messages"
          description={error.message}
          action={
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          }
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MessageUserAuth 
        onUserIdChange={setCurrentUserId}
        onError={setError}
      />
      <TranslationProvider>
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar"
        >
          {isFetchingNextPage && <LoadingMessages />}
          <div ref={loadMoreRef} className="h-4" />
          <TranslationConsumer 
            messages={messages} 
            currentUserId={currentUserId}
            userLanguage={userLanguage}
            onNewReceivedMessage={onNewReceivedMessage}
            onTranslation={onTranslation}
            onReply={onReply}
            replyToMessageId={replyToMessageId}
            sendReply={sendReply}
            cancelReply={cancelReply}
            refetch={refetch}
            messageRefs={messageRefs}
            scrollToMessage={scrollToMessage}
          />
          <div ref={messagesEndRef} />
        </div>
      </TranslationProvider>
    </ErrorBoundary>
  );
}

function TranslationConsumer({
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
}: {
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
}) {
  const { translatedContents } = useMessageProcessor(
    messages,
    currentUserId,
    userLanguage,
    onNewReceivedMessage,
    onTranslation
  );

  function shouldShowReplyInput(message: any) {
    if (replyToMessageId !== message.id) return false;
    const target = messages.find((m: any) => m.id === replyToMessageId);
    if (target && target.parent && target.parent.id) {
      const parentIsVisible = messages.some((m: any) => m.id === target.parent.id);
      if (parentIsVisible) return false;
    }
    return true;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
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
      {messages.map((message) => {
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
