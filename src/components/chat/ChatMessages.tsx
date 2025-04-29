
import { useState, useRef, useEffect } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { MessageReplyInput } from "./message/MessageReplyInput";
import { AlertCircle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { LoadMoreMessages } from "./message/LoadMoreMessages";
import { MessageUserAuth } from "./message/MessageUserAuth";
import { TranslationConsumer } from "./message/TranslationConsumer";
import { supabase } from "@/integrations/supabase/client";
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
  const [userIdLoading, setUserIdLoading] = useState(true);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  console.log('ChatMessages render:', {
    messagesCount: messages.length,
    isFetchingNextPage,
    hasNextPage,
    refetchAvailable: !!refetch,
    currentUserId,
    userIdLoading
  });
  
  const { 
    scrollContainerRef, 
    loadMoreRef, 
    messagesEndRef
  } = useMessageScroll({
    messages,
    refetch,
    hasNextPage,
    isFetchingNextPage
  });

  const handleUserIdChange = (userId: string | null) => {
    console.log("User ID changed to:", userId);
    setCurrentUserId(userId);
    setUserIdLoading(false);
  };

  const handleError = (err: Error) => {
    console.error("ChatMessages error:", err);
    setError(err);
    setUserIdLoading(false);
  };

  const handleRetry = () => {
    console.log("Retrying message load");
    setError(null);
    setUserIdLoading(true);
    // Force re-fetch
    if (refetch) {
      refetch();
    }
    // Re-check authentication
    checkAuthentication();
  };

  const checkAuthentication = async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error in ChatMessages:", authError);
        handleError(authError);
        return;
      }
      
      handleUserIdChange(data?.user?.id || null);
    } catch (err) {
      console.error("Error checking auth in ChatMessages:", err);
      handleError(err instanceof Error ? err : new Error("Failed to check authentication"));
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

  // If user ID is still loading, show a loading state
  if (userIdLoading) {
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
      <MessageUserAuth 
        onUserIdChange={handleUserIdChange}
        onError={handleError}
      />
      {!userIdLoading && currentUserId !== null && (
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
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </TranslationProvider>
      )}
    </ErrorBoundary>
  );
}
