
import { useState, useCallback } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { useChat } from "@/hooks/use-chat";
import { useMessageReply } from "@/hooks/use-message-reply";
import { usePredictiveAnswers } from "@/hooks/use-predictive-answers";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatErrorState } from "../states/ChatErrorState";
import { ChatLoadingState } from "../states/ChatLoadingState";
import { ChatContainer } from "../container/ChatContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSkeleton } from "@/components/chat/message/MessageSkeleton";

interface ChatContentProps {
  conversationId: string;
}

export function ChatContent({ conversationId }: ChatContentProps) {
  const { messages, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { sendMessage } = useChat(conversationId);
  const { replyToMessageId, startReply, cancelReply, sendReply } = useMessageReply(conversationId);
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    generateSuggestions, 
    clearSuggestions 
  } = usePredictiveAnswers(conversationId, translatedContents);
  
  const handleSendMessage = async (
    content: string, 
    voiceMessageData?: { base64Audio: string; audioPath?: string }, 
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    await sendMessage(content, voiceMessageData, location, attachments);
    clearSuggestions();
  };

  const handleNewReceivedMessage = useCallback(() => {
    console.log("New message received, translations available:", translatedContents);
    generateSuggestions();
  }, [generateSuggestions, translatedContents]);

  const handleTranslation = useCallback((messageId: string, translatedContent: string) => {
    console.log("Translation received:", { messageId, translatedContent });
    setTranslatedContents(prev => ({
      ...prev,
      [messageId]: translatedContent
    }));
  }, []);

  if (error) {
    return (
      <ChatErrorState 
        error={error} 
        conversationId={conversationId}
        replyToMessageId={replyToMessageId}
        onCancelReply={cancelReply}
        onRetry={() => hasNextPage && fetchNextPage()}
      />
    );
  }

  if (isLoading || isLoadingProfile) {
    return <ChatLoadingState conversationId={conversationId} />;
  }

  return (
    <ChatContainer>
      <ChatHeader 
        conversationId={conversationId} 
        replyToMessageId={replyToMessageId}
        onCancelReply={cancelReply}
      />
      
      <div className={cn(
        "flex-1 overflow-hidden relative",
        "pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)]",
        isMobile ? "pt-[calc(4rem+env(safe-area-inset-top,0px))]" : "pt-4"
      )}>
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </div>
          }>
            <ChatMessages 
              messages={messages} 
              userLanguage={profile?.language}
              onNewReceivedMessage={handleNewReceivedMessage}
              onTranslation={handleTranslation}
              onReply={startReply}
              replyToMessageId={replyToMessageId}
              sendReply={sendReply}
              cancelReply={cancelReply}
              refetch={() => hasNextPage && fetchNextPage()}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className={cn(
        "w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t sticky bottom-0 z-20"
      )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <ChatInput
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
        />
      </div>
    </ChatContainer>
  );
}
