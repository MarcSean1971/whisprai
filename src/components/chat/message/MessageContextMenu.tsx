
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
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        {showTranslationToggle && (
          <ContextMenuItem onClick={onToggleTranslation}>
            <Languages className="mr-2 h-4 w-4" />
            Toggle Translation
          </ContextMenuItem>
        )}
        <ContextMenuItem>
          <Smile className="mr-2 h-4 w-4" />
          Add Reaction
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
