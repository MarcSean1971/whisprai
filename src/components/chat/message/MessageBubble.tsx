import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { MessageReactions } from "./reactions/MessageReactions";
import { ParentMessagePreview } from "./ParentMessagePreview";
import { MessageAttachments } from "./MessageAttachments";
import { formatMessageDateTime } from "@/lib/utils";
import { ListTodo } from "lucide-react";
import { useMessageTodoStatus } from "@/hooks/use-message-todo-status";

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
  content = "",
  timestamp = "",
  isOwn = false,
  isAIMessage = false,
  children, 
  attachment,
  attachments,
  onReply,
  parent,
  scrollToMessage
}: MessageBubbleProps) {
  if (!id) {
    console.error("MessageBubble missing required id prop");
    return null;
  }

  const { data: hasTodo } = useMessageTodoStatus(id);

  const formattedTime = formatMessageDateTime(timestamp);

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
        {parent && parent.id && parent.content && (
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
          <div className="flex-1 flex justify-end items-center gap-1">
            {hasTodo && (
              <ListTodo className="h-4 w-4 text-muted-foreground animate-fade-in" />
            )}
            <span className="text-[10px] opacity-70 text-right">
              {formattedTime}
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
