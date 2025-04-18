
import { Check, CheckCheck, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface ChatMessageProps {
  content: string;
  timestamp: string;
  isOwn?: boolean;
  status?: MessageStatus;
  sender?: {
    name: string;
    avatar?: string;
  };
  showSender?: boolean;
  isAI?: boolean;
  aiSuggestion?: boolean;
  translateTo?: string;
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
  aiSuggestion = false,
  translateTo,
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

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%] animate-fade-in",
        isOwn ? "ml-auto" : "mr-auto",
        aiSuggestion && "opacity-80"
      )}
    >
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
        
        <div
          className={cn(
            "rounded-2xl py-3 px-4",
            isOwn
              ? "bg-primary text-primary-foreground"
              : isAI
              ? "bg-accent/10 border border-accent/20"
              : "bg-secondary",
            aiSuggestion && "border border-dashed"
          )}
        >
          <div>{content}</div>
          
          {translateTo && translatedContent && (
            <div className="mt-2 pt-2 border-t border-primary-foreground/20 text-primary-foreground/80 text-sm">
              <div className="text-xs mb-1 text-primary-foreground/60">
                Translated to {translateTo}:
              </div>
              {translatedContent}
            </div>
          )}
          
          <div className="flex justify-end items-center gap-1 mt-1">
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
