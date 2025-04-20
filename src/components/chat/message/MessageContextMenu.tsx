
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Reply, Languages, Smile } from "lucide-react";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReply: () => void;
  onToggleTranslation: () => void;
  showTranslationToggle: boolean;
  isOwn: boolean;
  messageId: string;
}

export function MessageContextMenu({
  children,
  onReply,
  onToggleTranslation,
  showTranslationToggle,
  isOwn,
  messageId
}: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="inline-block w-full touch-none" asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95"
      >
        <ContextMenuItem className="cursor-pointer" onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          <span>Reply</span>
        </ContextMenuItem>
        {showTranslationToggle && (
          <ContextMenuItem className="cursor-pointer" onClick={onToggleTranslation}>
            <Languages className="mr-2 h-4 w-4" />
            <span>Toggle Translation</span>
          </ContextMenuItem>
        )}
        <ContextMenuItem className="cursor-pointer">
          <Smile className="mr-2 h-4 w-4" />
          <span>Add Reaction</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
