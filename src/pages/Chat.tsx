
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
import { CallManager } from "@/components/chat/voice-call/CallManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Safe guard against undefined ID
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
  const { data: messages = [], isLoading, error, refetch } = useMessages(conversationId);
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { sendMessage, userId } = useChat(conversationId);
  const { replyToMessageId, startReply, cancelReply, sendReply } = useMessageReply(conversationId);
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  
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
    refetch();
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
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <ChatHeader 
          conversationId={conversationId} 
          replyToMessageId={replyToMessageId}
          onCancelReply={cancelReply}
        />
        <div className="flex-1 overflow-hidden relative">
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-destructive" />}
            title="Error loading chat"
            description={error?.message || "Failed to load the chat. Please try again."}
            action={
              <Button onClick={() => refetch()} variant="outline">
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
        <div className="flex-1 overflow-hidden relative">
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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader 
        conversationId={conversationId} 
        replyToMessageId={replyToMessageId}
        onCancelReply={cancelReply}
      />
      <div className="flex-1 overflow-hidden relative">
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
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div className="w-full bg-background border-t">
        <ChatInput
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
        />
      </div>
      
      <CallManager />
    </div>
  );
}

