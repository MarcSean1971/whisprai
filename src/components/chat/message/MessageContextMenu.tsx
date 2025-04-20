
import { MoreVertical } from "lucide-react";
import { Reply, Languages, Smile, X } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  };

  return (
    <div className="group flex flex-col gap-1">
      {/* Main content layout */}
      <div className="flex items-start gap-2">
        {/* Menu for own messages */}
        {isOwn && (
          <div className="pt-2">
            <DropdownMenu 
              open={isDropdownOpen} 
              onOpenChange={(open) => {
                setIsDropdownOpen(open);
                if (!open) {
                  setIsEmojiPickerOpen(false);
                }
              }}
            >
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
                ref={dropdownRef}
                align="start"
                side="bottom"
                className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md z-50"
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
                  onSelect={(e) => e.preventDefault()}
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

        {/* Menu for other users' messages */}
        {!isOwn && (
          <div className="pt-2">
            <DropdownMenu 
              open={isDropdownOpen} 
              onOpenChange={(open) => {
                setIsDropdownOpen(open);
                if (!open) {
                  setIsEmojiPickerOpen(false);
                }
              }}
            >
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
                ref={dropdownRef}
                align="end"
                side="bottom"
                className="min-w-[160px] overflow-hidden bg-popover border rounded-md shadow-md z-50"
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
                  onSelect={(e) => e.preventDefault()}
                >
                  <Smile className="mr-2 h-4 w-4" />
                  <span>Add Reaction</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => {
            setIsEmojiPickerOpen(false);
            setIsDropdownOpen(false);
          }}
        >
          <div 
            className="absolute"
            style={{
              top: dropdownRef.current?.getBoundingClientRect().bottom ?? 0,
              left: isOwn 
                ? dropdownRef.current?.getBoundingClientRect().left ?? 0
                : (dropdownRef.current?.getBoundingClientRect().right ?? 0) - 300,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-popover border rounded-md shadow-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Choose an emoji</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEmojiPickerOpen(false);
                    setIsDropdownOpen(false);
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <EmojiPicker
                width={300}
                height={350}
                onEmojiClick={handleEmojiSelect}
                lazyLoadEmojis={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
