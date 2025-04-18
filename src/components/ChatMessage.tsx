
import { Check, CheckCheck, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TranslationIcon } from "./chat/TranslationIcon";
import { useState } from "react";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface ChatMessageProps {
  content: string;
  timestamp: string;
  isOwn?: boolean;
  status?: MessageStatus;
  sender?: {
    name: string;
    avatar?: string;
    language?: string;
  };
  showSender?: boolean;
  isAI?: boolean;
  originalLanguage?: string;
  translatedContent?: string;
}

export function ChatMessage({
  content,
  timestamp,
  isOwn = false,
  status = "sent",
  sender,
  showSender = false,
  isAI = false,
  originalLanguage,
  translatedContent,
}: ChatMessageProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3" />;
      case "sent":
        return <Check className="h-3 w-3" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-whispr-purple" />;
      default:
        return null;
    }
  };

  const [showOriginal, setShowOriginal] = useState(false);
  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent;

  return (
    <div className={cn(
      "flex gap-2 max-w-[85%] animate-fade-in",
      isOwn ? "ml-auto" : "mr-auto"
    )}>
      {!isOwn && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {sender.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col">
        {showSender && sender && !isOwn && (
          <span className="text-xs text-muted-foreground mb-1">
            {sender.name}
          </span>
        )}
        
        <div className={cn(
          "rounded-2xl py-3 px-4 relative",
          isOwn
            ? "bg-primary text-primary-foreground"
            : isAI
            ? "bg-accent/10 border border-accent/20"
            : "bg-secondary"
        )}>
          <div>{displayContent}</div>
          
          <div className="flex justify-end items-center gap-1 mt-1">
            {hasTranslation && !isOwn && (
              <TranslationIcon 
                originalLanguage={originalLanguage || 'unknown'}
                onClick={() => setShowOriginal(!showOriginal)}
              />
            )}
            <span className="text-[10px] opacity-70">
              {timestamp}
            </span>
            {isOwn && getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
