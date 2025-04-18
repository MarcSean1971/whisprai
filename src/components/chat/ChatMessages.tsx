
import { useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
}

export function ChatMessages({ messages = [], userLanguage = 'en' }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translateMessage } = useTranslation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwn = message.sender.id === supabase.auth.user()?.id;
        const showSender = 
          !isOwn && 
          (index === 0 || messages[index - 1].sender.id !== message.sender.id);
          
        const needsTranslation = 
          !isOwn && 
          message.original_language !== userLanguage;

        const translatedContent = needsTranslation 
          ? translateMessage(message.content, userLanguage)
          : null;
          
        return (
          <ChatMessage
            key={message.id}
            content={message.content}
            timestamp={new Date(message.created_at).toLocaleTimeString()}
            isOwn={isOwn}
            status={message.status}
            sender={{
              name: `${message.sender.profiles.first_name} ${message.sender.profiles.last_name}`,
              avatar: message.sender.profiles.avatar_url,
              language: message.sender.profiles.language
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
