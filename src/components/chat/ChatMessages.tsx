
import { useState, useRef, useEffect } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { MessageReplyInput } from "./message/MessageReplyInput";
import { AlertCircle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { LoadMoreMessages } from "./message/LoadMoreMessages";
import { TranslationConsumer } from "./message/TranslationConsumer";
import { Button } from "@/components/ui/button";

interface ChatMessagesProps {
  messages: any[];
  userId: string | null; // Ensure this is defined properly
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  fetchNextPage?: () => Promise<unknown>;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  error?: Error | null;
  isLoading?: boolean;
}

export function ChatMessages({ 
  messages = [], 
  userId, // Accept userId directly from props
  userLanguage = 'en',
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  fetchNextPage,
  isFetchingNextPage = false,
  hasNextPage = false,
  error = null,
  isLoading = false
}: ChatMessagesProps) {
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  console.log('ChatMessages render:', {
    messagesCount: messages.length,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPageAvailable: !!fetchNextPage,
    userId,
    isLoading
  });
  
  const { 
    scrollContainerRef, 
    loadMoreRef, 
    messagesEndRef
  } = useMessageScroll({
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  });

  const handleRetry = () => {
    console.log("Retrying message load");
    // Force re-fetch
    if (fetchNextPage) {
      fetchNextPage();
    }
  };

  const [safeAreaPaddingBottom, setSafeAreaPaddingBottom] = useState('7rem');
  
  useEffect(() => {
    const updateSafeAreaPadding = () => {
      const safeAreaBottom = getComputedStyle(document.documentElement)
        .getPropertyValue('--sab') || '0px';
      
      setSafeAreaPaddingBottom(`calc(7rem + ${safeAreaBottom})`);
    };
    
    updateSafeAreaPadding();
    window.addEventListener('resize', updateSafeAreaPadding);
    
    return () => window.removeEventListener('resize', updateSafeAreaPadding);
  }, []);

  const scrollToMessage = (messageId: string) => {
    const ref = messageRefs.current[messageId];
    if (ref && typeof ref.scrollIntoView === "function") {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (error) {
    return (
      <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-4">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="Error loading messages"
          description={error.message}
          action={
            <Button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // If userId is null or still loading, show a loading state
  if (isLoading || userId === null) {
    return (
      <div className="absolute inset-0 overflow-y-auto flex items-center justify-center">
        <div className="space-y-4">
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  // If we have no messages after loading user ID, show empty state
  if (messages.length === 0) {
    return (
      <div className="absolute inset-0 overflow-y-auto flex items-center justify-center">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
          title="No messages yet"
          description="Start a conversation by sending a message below."
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {userId !== null && (
        <TranslationProvider>
          <div 
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto no-scrollbar overscroll-none flex flex-col z-10"
            style={{
              paddingBottom: safeAreaPaddingBottom
            }}
          >
            <div ref={loadMoreRef} className="h-4" />
            <LoadMoreMessages 
              isLoading={isFetchingNextPage || false} 
              hasNextPage={hasNextPage || false} 
            />
            <div className="flex-1" />
            <div className="px-4 py-2 space-y-4">
              <TranslationConsumer 
                messages={messages} 
                currentUserId={userId}
                userLanguage={userLanguage}
                onNewReceivedMessage={onNewReceivedMessage}
                onTranslation={onTranslation}
                onReply={onReply}
                replyToMessageId={replyToMessageId}
                sendReply={sendReply}
                cancelReply={cancelReply}
                refetch={fetchNextPage}
                messageRefs={messageRefs}
                scrollToMessage={scrollToMessage}
              />
            </div>
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </TranslationProvider>
      )}
    </ErrorBoundary>
  );
}
