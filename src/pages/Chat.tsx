
import { useParams, useNavigate } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { useChat } from "@/hooks/use-chat";
import { usePredictiveAnswers } from "@/hooks/use-predictive-answers";
import { useMessageReply } from "@/hooks/use-message-reply";
import { Loader2, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, Suspense, useEffect } from "react";
import { MessageSkeleton } from "@/components/chat/message/MessageSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { NetworkStatus } from "@/components/ui/network-status";
import { useConnectionManager } from "@/hooks/use-connection-manager";
import { toast } from "@/components/ui/use-toast";

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
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
  const { 
    messages, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch,
    isOffline,
    reconnect
  } = useMessages(conversationId);
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { sendMessage, userId } = useChat(conversationId);
  const { replyToMessageId, startReply, cancelReply, sendReply } = useMessageReply(conversationId);
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const { isOnline, refreshConnection } = useConnectionManager();
  
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
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Your message will be sent when you reconnect.",
        variant: "destructive"
      });
      // Here you could store pending messages for later sending
      return;
    }
    
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

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await reconnect();
      if (success) {
        toast({
          title: "Connection restored",
          description: "Chat messages are now up to date"
        });
      } else {
        toast({
          title: "Reconnection failed",
          description: "Please check your internet connection",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error during reconnection:", err);
    } finally {
      setIsReconnecting(false);
    }
  };

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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader 
        conversationId={conversationId} 
        replyToMessageId={replyToMessageId}
        onCancelReply={cancelReply}
      >
        <NetworkStatus isOnline={isOnline} className="ml-2" />
      </ChatHeader>
      
      <div className="flex-1 overflow-hidden relative pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] mt-[calc(4rem+env(safe-area-inset-top,0px))]">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <EmptyState
              icon={<AlertCircle className="h-10 w-10 text-destructive" />}
              title={isOffline ? "You're offline" : "Error loading chat"}
              description={isOffline 
                ? "Please check your internet connection" 
                : error?.message || "Failed to load the chat. Please try again."}
              action={
                <Button 
                  onClick={handleReconnect} 
                  variant="outline"
                  disabled={isReconnecting}
                >
                  {isReconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try again
                    </>
                  )}
                </Button>
              }
              className="absolute inset-0 flex items-center justify-center"
            />
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
              
              {isOffline && (
                <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                  <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm flex items-center">
                    <WifiOff className="h-4 w-4 mr-2" />
                    You're offline
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-7 px-2 text-xs"
                      onClick={handleReconnect}
                      disabled={isReconnecting}
                    >
                      {isReconnecting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Reconnect'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      
      <div
        className="w-full bg-background border-t sticky bottom-0 z-20"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom,0px)'
        }}
      >
        <ChatInput
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          isOffline={isOffline}
        />
      </div>
    </div>
  );
}
