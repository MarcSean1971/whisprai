
import { useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import type { MessageType } from "@/pages/Chat";

interface ChatMessagesProps {
  messages: MessageType[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwn = message.sender.id === "me";
        const showSender = 
          !isOwn && 
          (index === 0 || messages[index - 1].sender.id !== message.sender.id);
          
        return (
          <ChatMessage
            key={message.id}
            content={message.content}
            timestamp={message.timestamp}
            isOwn={isOwn}
            status={message.status}
            sender={message.sender}
            showSender={showSender}
            isAI={message.isAI}
            translateTo={message.translateTo}
            translatedContent={message.translatedContent}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
