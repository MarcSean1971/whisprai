import { useRef, useEffect, useState, useCallback, memo } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";
import { MessageSkeleton } from "./message/MessageSkeleton";

const MemoizedChatMessage = memo(ChatMessage);

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
}

export function ChatMessages({ 
  messages = [], 
  userLanguage = 'en',
  onNewReceivedMessage,
  onTranslation
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translateMessage } = useTranslation();
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const { profile } = useProfile();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
  const [translationsInProgress, setTranslationsInProgress] = useState(0);
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

  useEffect(() => {
    let mounted = true;

    const processNewMessage = () => {
      if (!messages.length || !currentUserId || translationsInProgress > 0) return;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id === lastProcessedMessageId) return;

      if (lastMessage.sender_id !== currentUserId) {
        setLastProcessedMessageId(lastMessage.id);
        onNewReceivedMessage?.();
      }
    };

    processNewMessage();

    return () => {
      mounted = false;
    };
  }, [messages, currentUserId, lastProcessedMessageId, onNewReceivedMessage, translationsInProgress]);

  const processTranslations = useCallback(async () => {
    if (!profile?.language || !currentUserId || translationsInProgress > 0) return;

    const pendingTranslations = messages
      .filter(message => 
        message.sender_id !== currentUserId &&
        message.sender_id !== null &&
        message.original_language &&
        message.original_language !== profile.language &&
        !translatedContents[message.id]
      )
      .slice(0, 5);

    if (pendingTranslations.length === 0) return;

    setTranslationsInProgress(pendingTranslations.length);
    
    try {
      await Promise.all(
        pendingTranslations.map(async (message) => {
          const translated = await translateMessage(message.content, profile.language);
          if (translated !== message.content) {
            setTranslatedContents(prev => ({
              ...prev,
              [message.id]: translated
            }));
            
            onTranslation?.(message.id, translated);
          }
        })
      );
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslationsInProgress(0);
    }
  }, [messages, profile?.language, currentUserId, translatedContents, translateMessage, onTranslation]);

  useEffect(() => {
    let mounted = true;

    const runTranslations = async () => {
      if (mounted) {
        await processTranslations();
      }
    };

    runTranslations();

    return () => {
      mounted = false;
    };
  }, [processTranslations]);

  const handleMessageDelete = useCallback(() => {
    console.log('Message was deleted, UI will update via React Query cache');
  }, []);

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
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
      {messages.map((message, index) => {
        const isOwn = message.sender_id === currentUserId;
        const isAI = message.sender_id === null && !message.metadata?.isAIPrompt;
        const isAIPrompt = message.metadata?.isAIPrompt;
        
        const showSender = !isOwn && !isAI && !isAIPrompt && 
                          (index === 0 || messages[index - 1].sender_id !== message.sender_id);
        
        const needsTranslation = !isOwn && 
          !isAI && 
          !isAIPrompt && 
          message.original_language && 
          message.original_language !== profile?.language;

        const translatedContent = needsTranslation ? translatedContents[message.id] : undefined;
        const formattedTimestamp = format(new Date(message.created_at), 'HH:mm');

        const location = message.metadata?.location ? {
          latitude: message.metadata.location.latitude,
          longitude: message.metadata.location.longitude
        } : undefined;

        return (
          <MemoizedChatMessage
            key={message.id}
            id={message.id}
            content={message.content}
            timestamp={formattedTimestamp}
            isOwn={isOwn}
            isAI={isAI}
            status={message.status}
            sender={message.sender && {
              name: `${message.sender.profiles?.first_name || ''} ${message.sender.profiles?.last_name || ''}`.trim(),
              avatar: message.sender.profiles?.avatar_url,
              language: message.sender.profiles?.language
            }}
            showSender={showSender}
            originalLanguage={message.original_language}
            translatedContent={translatedContent}
            location={location}
            userId={currentUserId}
            conversationId={message.conversation_id}
            onDelete={handleMessageDelete}
            metadata={message.metadata}
            userLanguage={profile?.language}
          />
        );
      })}
      <div ref={messagesEndRef} />
      {translationsInProgress > 0 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Translating messages...
        </div>
      )}
    </div>
  );
}
