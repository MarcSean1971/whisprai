
import { useRef, useEffect, useState, createRef } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageReplyInput } from "./message/MessageReplyInput";
import { AlertCircle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";

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
  userLanguage = 'en',
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build a ref map for message ids
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUserId(data.user?.id || null);
      } catch (err) {
        console.error('Error fetching user ID:', err);
        setError(err instanceof Error ? err : new Error('Failed to get user information'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (messages.length > previousMessagesLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  // Populate refs for each message
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

  // Provides a scrollToMessage function down the tree
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

  if (isLoading || messages.length === 0) {
    return (
      <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <TranslationProvider>
        <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
          <div ref={loadMoreRef} className="h-4 flex justify-center">
            {isFetchingNextPage && (
              <Button variant="ghost" size="sm" disabled className="py-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more messages...
              </Button>
            )}
          </div>
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

// Separate component that uses the translation hooks inside the provider
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

  // Only show reply input for the current reply target and not its parent (if also rendered)
  function shouldShowReplyInput(message: any) {
    if (replyToMessageId !== message.id) return false;
    // If the parent is present and rendered, do NOT show the input here
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
