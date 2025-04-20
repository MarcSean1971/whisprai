
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { MessageMenuButton } from "./context-menu/MessageMenuButton";
import { MessageMenuItems } from "./context-menu/MessageMenuItems";
import { EmojiPickerPopover } from "./context-menu/EmojiPickerPopover";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReply: () => void;
  onToggleTranslation: () => void;
  showTranslationToggle: boolean;
  isOwn: boolean;
  messageId: string;
  canDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function MessageContextMenu({
  children,
  onReply,
  onToggleTranslation,
  showTranslationToggle,
  isOwn,
  messageId,
  canDelete,
  onDelete,
  isDeleting
}: MessageContextMenuProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const { addReaction } = useMessageReactions(messageId);

  const handleEmojiSelect = (emojiData: any) => {
    addReaction({ emoji: emojiData.emoji });
    setIsEmojiPickerOpen(false);
  };

  return (
    <div className="group flex flex-col gap-1">
      <div className="flex items-start gap-2">
        {isOwn && (
          <div className="pt-2">
            <DropdownMenu>
              <MessageMenuButton />
              <DropdownMenuContent
                align="start"
                side="bottom"
                className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md z-50"
              >
                <MessageMenuItems
                  onReply={onReply}
                  onToggleTranslation={onToggleTranslation}
                  showTranslationToggle={showTranslationToggle}
                  onDelete={onDelete}
                  canDelete={canDelete}
                  isDeleting={isDeleting}
                />
                <EmojiPickerPopover
                  onEmojiSelect={handleEmojiSelect}
                  isOpen={isEmojiPickerOpen}
                  onOpenChange={setIsEmojiPickerOpen}
                  align="start"
                  side="right"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <div className="flex-1">{children}</div>

        {!isOwn && (
          <div className="pt-2">
            <DropdownMenu>
              <MessageMenuButton />
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md z-50"
              >
                <MessageMenuItems
                  onReply={onReply}
                  onToggleTranslation={onToggleTranslation}
                  showTranslationToggle={showTranslationToggle}
                  onDelete={onDelete}
                  canDelete={canDelete}
                  isDeleting={isDeleting}
                />
                <EmojiPickerPopover
                  onEmojiSelect={handleEmojiSelect}
                  isOpen={isEmojiPickerOpen}
                  onOpenChange={setIsEmojiPickerOpen}
                  align="end"
                  side="left"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
