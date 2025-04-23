
import { useParams, useNavigate } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { useChat } from "@/hooks/use-chat";
import { usePredictiveAnswers } from "@/hooks/use-predictive-answers";
import { useMessageReply } from "@/hooks/use-message-reply";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, Suspense, useEffect } from "react";
import { MessageSkeleton } from "@/components/chat/message/MessageSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!id) {
      console.error("No conversation ID provided");
      navigate("/chats", { replace: true });
    }
  }, [id, navigate]);
  
  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="h-10 w-10 text-destructive mr-2" />
        <p>Invalid conversation ID. Redirecting...</p>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ChatContent conversationId={id} />
    </ErrorBoundary>
  );
}

function ChatContent({ conversationId }: { conversationId: string }) {
  const { messages, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { sendMessage, userId } = useChat(conversationId);
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

  const refetch = () => {
    if (hasNextPage) {
      console.log('Fetching next page of messages');
      fetchNextPage();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <ChatHeader 
          conversationId={conversationId} 
          replyToMessageId={replyToMessageId}
          onCancelReply={cancelReply}
        />
        <div className="flex-1 overflow-hidden relative pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] mt-[calc(4rem+env(safe-area-inset-top,0px))]">
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-destructive" />}
            title="Error loading chat"
            description={error?.message || "Failed to load the chat. Please try again."}
            action={
              <Button onClick={refetch} variant="outline">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retry
              </Button>
            }
            className="absolute inset-0 flex items-center justify-center"
          />
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <ChatHeader 
          conversationId={conversationId} 
          replyToMessageId={null}
          onCancelReply={() => {}}
        />
        <div className="flex-1 overflow-hidden relative pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] mt-[calc(4rem+env(safe-area-inset-top,0px))]">
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-[100dvh] w-full bg-background overflow-hidden",
      "relative isolate"
    )}>
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
        {error ? (
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-destructive" />}
            title="Error loading chat"
            description={error?.message || "Failed to load the chat. Please try again."}
            action={
              <Button onClick={refetch} variant="outline">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retry
              </Button>
            }
            className="absolute inset-0 flex items-center justify-center"
          />
        ) : isLoading || isLoadingProfile ? (
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : (
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
                refetch={refetch}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
              />
            </Suspense>
          </ErrorBoundary>
        )}
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
    </div>
  );
}
