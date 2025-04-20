
import { useRef, useEffect, useState } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
}

export function ChatMessages({ 
  messages = [], 
  userLanguage = 'en',
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const [translationsInProgress, setTranslationsInProgress] = useState(0);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (messages.length > previousMessagesLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPreviousMessagesLength(messages.length);
  }, [messages.length, previousMessagesLength]);

  if (messages.length === 0) {
    return (
      <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <TranslationProvider>
      <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
        {/* We're now inside the TranslationProvider, so it's safe to use the useMessageProcessor hook */}
        <TranslationConsumer 
          messages={messages} 
          currentUserId={currentUserId}
          userLanguage={userLanguage}
          onNewReceivedMessage={onNewReceivedMessage}
          onTranslation={onTranslation}
          onReply={onReply}
          replyToMessageId={replyToMessageId}
        />
        <div ref={messagesEndRef} />
      </div>
    </TranslationProvider>
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
  replyToMessageId
}: {
  messages: any[];
  currentUserId: string | null;
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
}) {
  // Now this hook is used inside the TranslationProvider
  const { translatedContents } = useMessageProcessor(
    messages,
    currentUserId,
    userLanguage,
    onNewReceivedMessage,
    onTranslation
  );

  return (
    <MessageList
      messages={messages}
      currentUserId={currentUserId}
      profile={{ language: userLanguage }}
      translatedContents={translatedContents}
      onReply={onReply}
      replyToMessageId={replyToMessageId}
    />
  );
}
