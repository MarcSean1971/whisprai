
import { useRef, useEffect } from "react";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MessagesLoadingState } from "./message/MessagesLoadingState";
import { MessagesErrorState } from "./message/MessagesErrorState";
import { MessagesInfiniteLoader } from "./message/MessagesInfiniteLoader";
import { TranslationConsumer } from "./TranslationConsumer";
import { MessageReplyInput } from "./message/MessageReplyInput";

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
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function ChatMessages({ 
  messages = [],
  userLanguage,
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch,
  hasNextPage,
  isFetchingNextPage
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { currentUserId, isLoading, error } = useCurrentUserId();
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    messages.forEach(message => {
      if (!messageRefs.current[message.id]) {
        messageRefs.current[message.id] = null;
      }
    });
  }, [messages]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || !refetch) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          refetch();
        }
      },
      { threshold: 0.5 }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [refetch, hasNextPage, isFetchingNextPage]);

  const scrollToMessage = (messageId: string) => {
    const ref = messageRefs.current[messageId];
    if (ref && typeof ref.scrollIntoView === "function") {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (error && refetch) {
    return <MessagesErrorState error={error} refetch={refetch} />;
  }

  if (isLoading) {
    return <MessagesLoadingState />;
  }

  return (
    <ErrorBoundary>
      <TranslationProvider>
        <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
          <MessagesInfiniteLoader 
            isFetchingNextPage={isFetchingNextPage || false}
            loaderRef={loadMoreRef}
          />
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
