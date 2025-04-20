
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { addReaction } = useMessageReactions(messageId);

  const handleEmojiSelect = (emojiData: any) => {
    addReaction({ emoji: emojiData.emoji });
    setIsEmojiPickerOpen(false);
    setIsDropdownOpen(false);
  };

  const handleDropdownChange = (open: boolean) => {
    if (!isEmojiPickerOpen) {
      setIsDropdownOpen(open);
    }
  };

  const handleAddReactionClick = (e: Event) => {
    e.preventDefault();
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiPickerChange = (open: boolean) => {
    setIsEmojiPickerOpen(open);
    if (!open) {
      setIsDropdownOpen(false);
    }
  };

  const menuContent = (
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
        onSelect={handleAddReactionClick}
      >
        <Smile className="mr-2 h-4 w-4" />
        <span>Add Reaction</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="group flex items-start gap-2">
      {isOwn && (
        <div className="pt-2">
          <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownChange}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={triggerRef}
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {menuContent}
          </DropdownMenu>
          <Popover open={isEmojiPickerOpen} onOpenChange={handleEmojiPickerChange}>
            <PopoverTrigger className="hidden" />
            <PopoverContent 
              className="w-full p-0" 
              align={isOwn ? "start" : "end"}
              sideOffset={5}
              style={{
                position: 'fixed',
                top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 5 : 0,
                left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
                zIndex: 100
              }}
            >
              <div className="z-[100]">
                <EmojiPicker
                  width={300}
                  height={350}
                  onEmojiClick={handleEmojiSelect}
                  lazyLoadEmojis={true}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>

      {!isOwn && (
        <div className="pt-2">
          <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownChange}>
            <DropdownMenuTrigger asChild>
              <Button 
                ref={triggerRef}
                variant="ghost" 
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {menuContent}
          </DropdownMenu>
          <Popover open={isEmojiPickerOpen} onOpenChange={handleEmojiPickerChange}>
            <PopoverTrigger className="hidden" />
            <PopoverContent 
              className="w-full p-0" 
              align={isOwn ? "start" : "end"}
              sideOffset={5}
              style={{
                position: 'fixed',
                top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 5 : 0,
                left: triggerRef.current ? triggerRef.current.getBoundingClientRect().right - 300 : 0,
                zIndex: 100
              }}
            >
              <div className="z-[100]">
                <EmojiPicker
                  width={300}
                  height={350}
                  onEmojiClick={handleEmojiSelect}
                  lazyLoadEmojis={true}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
