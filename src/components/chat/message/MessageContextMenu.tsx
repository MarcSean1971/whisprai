
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { MessageMenuButton } from "./context-menu/MessageMenuButton";
import { MessageMenuItems } from "./context-menu/MessageMenuItems";

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
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <div className="group flex flex-col gap-1">
      <div className="flex items-start gap-2">
        {isOwn && (
          <div className="pt-2">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
                  messageId={messageId}
                  onCloseMenu={() => setMenuOpen(false)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <div className="flex-1">{children}</div>

        {!isOwn && (
          <div className="pt-2">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
                  messageId={messageId}
                  onCloseMenu={() => setMenuOpen(false)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
