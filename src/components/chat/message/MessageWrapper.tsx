
import { cn } from "@/lib/utils";
import { MessageAvatar } from "./MessageAvatar";
import { ReactNode } from "react";

interface MessageWrapperProps {
  isOwn: boolean;
  isAIPrompt?: boolean;
  sender?: {
    name: string;
    avatar?: string;
  };
  showSender?: boolean;
  isAIMessage?: boolean;
  children: ReactNode;
}

export function MessageWrapper({
  isOwn,
  isAIPrompt,
  sender,
  showSender,
  isAIMessage,
  children
}: MessageWrapperProps) {
  return (
    <div className={cn(
      "flex gap-2 w-full items-start",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && !isAIPrompt && sender && (
        <MessageAvatar
          name={sender.name}
          avatar={sender.avatar}
          isAI={isAIMessage}
        />
      )}

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
