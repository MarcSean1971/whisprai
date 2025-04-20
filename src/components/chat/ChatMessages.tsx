
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
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <TranslationProvider>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          profile={{ language: userLanguage }}
          translatedContents={{}}
          onReply={onReply}
          replyToMessageId={replyToMessageId}
        />
        <div ref={messagesEndRef} />
      </div>
    </TranslationProvider>
  );
}
