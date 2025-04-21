
import { cn } from "@/lib/utils";
import { Reply } from "lucide-react";

interface ParentMessagePreviewProps {
  parent: {
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
  isOwn: boolean;
  isAIMessage: boolean;
  scrollToMessage?: (messageId: string) => void;
}

export function ParentMessagePreview({ parent, isOwn, isAIMessage, scrollToMessage }: ParentMessagePreviewProps) {
  const senderName = parent.sender?.profiles
    ? `${parent.sender.profiles.first_name || ''} ${parent.sender.profiles.last_name || ''}`.trim()
    : "Unknown User";

  const handleParentClick = () => {
    if (scrollToMessage && parent.id) {
      scrollToMessage(parent.id);
    }
  };

  return (
    <div
      className={cn(
        "mb-1 text-xs border-l-2 pl-2 py-1 bg-muted/40 rounded-sm cursor-pointer hover:bg-muted transition",
        isOwn
          ? "border-primary/40"
          : isAIMessage
          ? "border-violet-500/40"
          : "border-secondary/40"
      )}
      title="Replied message"
      tabIndex={0}
      onClick={handleParentClick}
      role="button"
      aria-label="Go to replied message"
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        <Reply className="h-3 w-3" />
        <span className="font-medium">{senderName}</span>
      </div>
      <p className="line-clamp-1 text-muted-foreground break-words whitespace-pre-wrap">{parent.content}</p>
    </div>
  );
}
