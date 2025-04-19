
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MessageWrapperProps {
  isOwn: boolean;
  sender?: {
    name: string;
    language?: string;
  };
  showSender?: boolean;
  isAIMessage?: boolean;
  isAIPrompt?: boolean;
  children: ReactNode;
}

export function MessageWrapper({
  isOwn,
  sender,
  showSender,
  isAIMessage,
  isAIPrompt,
  children
}: MessageWrapperProps) {
  return (
    <div className={cn(
      "flex w-full items-start",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {showSender && sender && !isOwn && !isAIMessage && (
          <span className="text-xs text-muted-foreground mb-0.5">
            {sender.name}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
