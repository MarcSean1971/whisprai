import { useState, useRef } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { MessageReplyInput } from "./message/MessageReplyInput";
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { LoadMoreMessages } from "./message/LoadMoreMessages";
import { MessageUserAuth } from "./message/MessageUserAuth";
import { TranslationConsumer } from "./message/TranslationConsumer";
import { useFullscreenMode } from "@/hooks/use-fullscreen-mode";
import { useIsMobile } from "@/hooks/use-mobile";

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
  hasNextPage?: boolean;
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
  isFetchingNextPage = false,
  hasNextPage = false
}: ChatMessagesProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { isMobile } = useIsMobile();
  const { scrollContainerRef, loadMoreRef, messagesEndRef } = useMessageScroll({
    messages,
    refetch,
    hasNextPage,
    isFetchingNextPage
  });

  useFullscreenMode();

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
          className="absolute inset-0 overflow-y-auto no-scrollbar overscroll-none flex flex-col z-10"
          style={{
            paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div ref={loadMoreRef} className="h-4" />
          <div className="flex-1" />
          <div className="px-4 py-2 space-y-4">
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
          </div>
          <div ref={messagesEndRef} />
        </div>
      </TranslationProvider>
    </ErrorBoundary>
  );
}
