
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { MessageReactions } from "./reactions/MessageReactions";
import { ParentMessagePreview } from "./ParentMessagePreview";
import { MessageAttachments } from "./MessageAttachments";

interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isAIMessage: boolean;
  children?: ReactNode;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
  onReply: () => void;
  parent?: {
    id: string;
    content: string;
    created_at: string;
    sender?: {
      id: string;
      profiles?: {
        first_name?: string | null;
        last_name?: string | null;
      }
    }
  };
  scrollToMessage?: (messageId: string) => void;
}

export function MessageBubble({ 
  id,
  content, 
  timestamp, 
  isOwn, 
  isAIMessage,
  children, 
  attachment,
  attachments,
  onReply,
  parent,
  scrollToMessage
}: MessageBubbleProps) {
  return (
    <div className="space-y-2">
      <div className={cn(
        "rounded-lg py-2 px-3 max-w-[400px] relative group",
        isOwn
          ? "bg-primary text-primary-foreground"
          : isAIMessage
          ? "bg-violet-500/20 border border-violet-500/20"
          : "bg-secondary"
      )}>
        {parent && (
          <ParentMessagePreview
            parent={parent}
            isOwn={isOwn}
            isAIMessage={isAIMessage}
            scrollToMessage={scrollToMessage}
          />
        )}
        <div className="text-sm break-words">{content}</div>
        <MessageAttachments 
          attachments={attachments}
          attachment={attachment}
        />
        <div className="flex w-full items-center mt-1">
          <div className="flex-1 flex justify-start">
            <MessageReactions messageId={id} isOwn={isOwn} />
          </div>
          <div className="flex-1 flex justify-end">
            <span className="text-[10px] opacity-70 text-right">
              {timestamp}
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
