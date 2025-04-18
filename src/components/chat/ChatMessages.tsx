
import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
}

export function ChatMessages({ messages = [], userLanguage = 'en' }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translateMessage } = useTranslation();
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Process translations for messages that need it
  useEffect(() => {
    const processTranslations = async () => {
      const newTranslations: Record<string, string> = {};
      
      for (const message of messages) {
        const isOwn = message.sender?.id === supabase.auth.getUser().then(res => res.data.user?.id);
        const needsTranslation = !isOwn && message.original_language && message.original_language !== userLanguage;
        
        if (needsTranslation && !translatedContents[message.id]) {
          try {
            const translated = await translateMessage(message.content, userLanguage);
            newTranslations[message.id] = translated;
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      }
      
      if (Object.keys(newTranslations).length > 0) {
        setTranslatedContents(prev => ({ ...prev, ...newTranslations }));
      }
    };
    
    processTranslations();
  }, [messages, userLanguage, translateMessage]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const currentUserId = supabase.auth.getUser().then(res => res.data.user?.id);
        const isOwn = message.sender?.id === currentUserId;
        const showSender = 
          !isOwn && 
          (index === 0 || messages[index - 1].sender?.id !== message.sender?.id);
          
        const needsTranslation = 
          !isOwn && 
          message.original_language && 
          message.original_language !== userLanguage;

        const translatedContent = needsTranslation 
          ? translatedContents[message.id]
          : null;
          
        return (
          <ChatMessage
            key={message.id}
            content={message.content}
            timestamp={new Date(message.created_at).toLocaleTimeString()}
            isOwn={isOwn}
            status={message.status}
            sender={message.sender && {
              name: `${message.sender.profiles?.first_name || ''} ${message.sender.profiles?.last_name || ''}`.trim(),
              avatar: message.sender.profiles?.avatar_url,
              language: message.sender.profiles?.language
            }}
            showSender={showSender}
            originalLanguage={message.original_language}
            translatedContent={translatedContent}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
