
import { MoreVertical } from "lucide-react";
import { Reply, Languages, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="group relative w-full">
      {children}
      <div className={`absolute top-2 ${isOwn ? "left-2" : "right-2"}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isOwn ? "start" : "end"}
            side="bottom"
            className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md"
          >
            <DropdownMenuItem className="cursor-pointer" onClick={onReply}>
              <Reply className="mr-2 h-4 w-4" />
              <span>Reply</span>
            </DropdownMenuItem>
            {showTranslationToggle && (
              <DropdownMenuItem className="cursor-pointer" onClick={onToggleTranslation}>
                <Languages className="mr-2 h-4 w-4" />
                <span>Toggle Translation</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer">
              <Smile className="mr-2 h-4 w-4" />
              <span>Add Reaction</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

