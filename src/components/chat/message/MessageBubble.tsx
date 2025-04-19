
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  isAIMessage: boolean;
  children?: ReactNode;
}

export function MessageBubble({ content, timestamp, isOwn, isAIMessage, children }: MessageBubbleProps) {
  return (
    <div className={cn(
      "rounded-lg py-2 px-3 max-w-[400px]",
      isOwn
        ? "bg-primary text-primary-foreground"
        : isAIMessage
        ? "bg-violet-500/20 border border-violet-500/20"
        : "bg-secondary"
    )}>
      <div className="text-sm break-words">{content}</div>
      {children}
      <div className="text-[10px] opacity-70 text-right mt-0.5">
        {timestamp}
      </div>
    </div>
  );
}
