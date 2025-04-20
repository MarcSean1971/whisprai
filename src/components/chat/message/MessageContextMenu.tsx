
import { MoreVertical } from "lucide-react";
import { Reply, Languages, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { useMessageReactions } from "@/hooks/use-message-reactions";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { addReaction } = useMessageReactions(messageId);

  const handleEmojiSelect = (emojiData: any) => {
    addReaction({ emoji: emojiData.emoji });
    setIsEmojiPickerOpen(false);
    setIsDropdownOpen(false);
  };

  const handleAddReactionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEmojiPickerOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <div className="group flex items-start gap-2">
      {isOwn && (
        <div className="pt-2">
          <DropdownMenu 
            open={isDropdownOpen} 
            onOpenChange={(open) => {
              if (!isEmojiPickerOpen) {
                setIsDropdownOpen(open);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                ref={buttonRef}
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
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
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleAddReactionClick}
              >
                <Smile className="mr-2 h-4 w-4" />
                <span>Add Reaction</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>

      {!isOwn && (
        <div className="pt-2">
          <DropdownMenu 
            open={isDropdownOpen} 
            onOpenChange={(open) => {
              if (!isEmojiPickerOpen) {
                setIsDropdownOpen(open);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button 
                ref={buttonRef}
                variant="ghost" 
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
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
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleAddReactionClick}
              >
                <Smile className="mr-2 h-4 w-4" />
                <span>Add Reaction</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Popover 
        open={isEmojiPickerOpen} 
        onOpenChange={setIsEmojiPickerOpen}
      >
        <PopoverTrigger asChild>
          <div className="hidden" />
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0 z-[100]"
          side="bottom"
          align={isOwn ? "start" : "end"}
          sideOffset={5}
        >
          <EmojiPicker
            width={300}
            height={350}
            onEmojiClick={handleEmojiSelect}
            lazyLoadEmojis={true}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
