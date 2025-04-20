
import { useParams } from "react-router-dom";
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
import { useState, useCallback, Suspense } from "react";
import { MessageSkeleton } from "@/components/chat/message/MessageSkeleton";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { data: messages, isLoading, error, refetch } = useMessages(id!);
  const { profile } = useProfile();
  const { sendMessage, userId } = useChat(id!);
  const { replyToMessageId, startReply, cancelReply, sendReply } = useMessageReply(id!);
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    generateSuggestions, 
    clearSuggestions 
  } = usePredictiveAnswers(id!, translatedContents);
  
  const handleSendMessage = async (
    content: string, 
    voiceMessageData?: { base64Audio: string; audioPath?: string }, 
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    if (replyToMessageId) {
      await sendReply(content);
    } else {
      await sendMessage(content, voiceMessageData, location, attachments);
    }
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

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="h-10 w-10 text-destructive mr-2" />
        <p>Invalid conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader 
        conversationId={id} 
        replyToMessageId={replyToMessageId}
        onCancelReply={cancelReply}
      />
      <Suspense fallback={
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      }>
        <ChatMessages 
          messages={messages || []} 
          userLanguage={profile?.language}
          onNewReceivedMessage={handleNewReceivedMessage}
          onTranslation={handleTranslation}
          onReply={startReply}
          replyToMessageId={replyToMessageId}
        />
      </Suspense>
      <ChatInput
        conversationId={id}
        onSendMessage={handleSendMessage}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        replyMode={!!replyToMessageId}
      />
    </div>
  );
}
