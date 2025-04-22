
import { useRef } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MessagesInfiniteLoader } from "./message/MessagesInfiniteLoader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesContainer } from "./message/MessagesContainer";
import { MessagesError } from "./message/MessagesError";
import { MessagesLoading } from "./message/MessagesLoading";

interface ChatMessagesProps {
  messages: any[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  refetch?: () => void;
}

export function ChatMessages({
  messages = [],
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  userLanguage = 'en',
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!Array.isArray(messages)) {
    return <MessagesError error={new Error("Invalid messages data")} />;
  }

  return (
    <ErrorBoundary>
      <TranslationProvider>
        <MessagesContainer>
          <ScrollArea className="h-full px-4 py-2 space-y-2">
            {hasNextPage && (
              <MessagesInfiniteLoader
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage}
                isLoading={isFetchingNextPage}
              />
            )}
            <MessageContent
              messages={messages}
              userLanguage={userLanguage}
              onNewReceivedMessage={onNewReceivedMessage}
              onTranslation={onTranslation}
              onReply={onReply}
              replyToMessageId={replyToMessageId}
              sendReply={sendReply}
              cancelReply={cancelReply}
              refetch={refetch}
            />
            <div ref={messagesEndRef} />
          </ScrollArea>
        </MessagesContainer>
      </TranslationProvider>
    </ErrorBoundary>
  );
}
