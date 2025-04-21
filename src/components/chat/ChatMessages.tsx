import { useRef, useEffect, useState, createRef } from "react";
import { MessageSkeleton } from "./message/MessageSkeleton";
import { useMessageProcessor } from "@/hooks/use-message-processor";
import { MessageList } from "./message/MessageList";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageReplyInput } from "./message/MessageReplyInput";

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
  refetch
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(messages.length);

  // Build a ref map for message ids
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // Populate refs for each message
  useEffect(() => {
    messages.forEach(message => {
      if (!messageRefs.current[message.id]) {
        messageRefs.current[message.id] = null;
      }
    });
  }, [messages]);

  // Provides a scrollToMessage function down the tree
  const scrollToMessage = (messageId: string) => {
    const ref = messageRefs.current[messageId];
    if (ref && typeof ref.scrollIntoView === "function") {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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

  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          ref={el => {
            messageRefs.current[message.id] = el;
          }}
        >
          <MessageList
            messages={[message]}
            currentUserId={currentUserId}
            profile={{ language: userLanguage }}
            translatedContents={translatedContents}
            onReply={onReply}
            replyToMessageId={replyToMessageId}
            scrollToMessage={scrollToMessage}
          />
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
      ))}
    </>
  );
}
