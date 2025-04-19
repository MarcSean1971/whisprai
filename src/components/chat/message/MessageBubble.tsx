
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  isAIMessage: boolean;
}

export function MessageBubble({ content, timestamp, isOwn, isAIMessage }: MessageBubbleProps) {
  return (
    <div className={cn(
      "rounded-lg py-2 px-3",
      isOwn
        ? "bg-primary text-primary-foreground"
        : isAIMessage
        ? "bg-violet-500/20 border border-violet-500/20"
        : "bg-secondary"
    )}>
      <div className="text-sm">{content}</div>
      <div className="text-[10px] opacity-70 text-right mt-0.5">
        {timestamp}
      </div>
    </div>
  );
}
