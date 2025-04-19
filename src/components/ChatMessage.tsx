
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
  sender,
  showSender = false,
  isAI = false,
  originalLanguage,
  translatedContent,
}: ChatMessageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent && content !== translatedContent;
  const showTranslationToggle = hasTranslation && originalLanguage !== 'en';

  return (
    <div className={cn(
      "flex gap-2 w-full items-start",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && sender && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {sender.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {showSender && sender && !isOwn && (
          <span className="text-xs text-muted-foreground mb-0.5">
            {sender.name}
          </span>
        )}
        
        <div className="flex items-start gap-2">
          <div className={cn(
            "rounded-lg py-2 px-3",
            isOwn
              ? "bg-primary text-primary-foreground"
              : isAI
              ? "bg-accent/10 border border-accent/20"
              : "bg-secondary"
          )}>
            <div className="text-sm">{displayContent}</div>
            <div className="text-[10px] opacity-70 text-right mt-0.25">
              {timestamp}
            </div>
          </div>

          {showTranslationToggle && (
            <TranslationIcon 
              originalLanguage={originalLanguage || 'unknown'}
              onClick={() => setShowOriginal(!showOriginal)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
