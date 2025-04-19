import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
}

export function ChatMessages({ messages = [], userLanguage = 'en' }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translateMessage } = useTranslation();
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const { profile } = useProfile();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const processTranslations = async () => {
      if (!profile?.language || !currentUserId) return;

      const newTranslations: Record<string, string> = {};
      
      for (const message of messages) {
        const isOwn = message.sender_id === currentUserId;
        
        const needsTranslation = !isOwn && 
          message.original_language && 
          message.original_language !== profile.language &&
          !translatedContents[message.id];
        
        if (needsTranslation) {
          try {
            const translated = await translateMessage(message.content, profile.language);
            if (translated !== message.content) {
              newTranslations[message.id] = translated;
            }
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
  }, [messages, profile?.language, translateMessage, currentUserId, translatedContents]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
      {messages.map((message, index) => {
        const isOwn = message.sender_id === currentUserId;
        const showSender = 
          !isOwn && 
          (index === 0 || messages[index - 1].sender_id !== message.sender_id);
          
        const needsTranslation = 
          !isOwn && 
          message.original_language && 
          message.original_language !== profile?.language;

        const translatedContent = needsTranslation 
          ? translatedContents[message.id]
          : undefined;

        return (
          <ChatMessage
            key={message.id}
            content={message.content}
            timestamp={new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
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
