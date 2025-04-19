import { useRef, useEffect, useState, useCallback } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";

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
  const [messageCount, setMessageCount] = useState(messages.length);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (messages.length > messageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setMessageCount(messages.length);
    } else if (messages.length < messageCount) {
      setMessageCount(messages.length);
    }
  }, [messages.length, messageCount]);

  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      const lastMessage = messages[messages.length - 1];
      
      if (
        lastMessage.sender_id !== currentUserId && 
        lastMessage.id !== lastProcessedMessageId &&
        translationsInProgress === 0
      ) {
        setLastProcessedMessageId(lastMessage.id);
        
        if (onNewReceivedMessage) {
          console.log("All translations complete, triggering new message handler");
          onNewReceivedMessage();
        }
      }
    }
  }, [messages, currentUserId, lastProcessedMessageId, onNewReceivedMessage, translationsInProgress]);

  const processTranslations = useCallback(async () => {
    if (!profile?.language || !currentUserId) return;

    const pendingTranslations: Promise<void>[] = [];
    let translationsCount = 0;

    for (const message of messages) {
      const isOwn = message.sender_id === currentUserId;
      const isAI = message.sender_id === null && !message.metadata?.isAIPrompt;
      
      const needsTranslation = !isOwn && 
        !isAI && 
        message.original_language && 
        message.original_language !== profile.language &&
        !translatedContents[message.id];
      
      if (needsTranslation) {
        translationsCount++;
        const translationPromise = (async () => {
          try {
            console.log(`Starting translation for message ${message.id}`);
            const translated = await translateMessage(message.content, profile.language);
            if (translated !== message.content) {
              console.log(`Translation completed for message ${message.id}`);
              setTranslatedContents(prev => ({
                ...prev,
                [message.id]: translated
              }));
              
              if (onTranslation) {
                onTranslation(message.id, translated);
              }
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
        })();
        pendingTranslations.push(translationPromise);
      }
    }
    
    if (translationsCount > 0) {
      setTranslationsInProgress(translationsCount);
      await Promise.all(pendingTranslations);
      setTranslationsInProgress(0);
      console.log("All translations completed");
    }
  }, [messages, profile?.language, currentUserId, translatedContents, translateMessage, onTranslation]);

  useEffect(() => {
    processTranslations();
  }, [processTranslations]);

  const handleMessageDelete = () => {
    console.log('Message was deleted, UI will update via React Query cache');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
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
          <ChatMessage
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
    </div>
  );
}
