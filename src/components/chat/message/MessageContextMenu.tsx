import { MoreVertical } from "lucide-react";
import { Reply, Languages, Smile, X, Trash2 } from "lucide-react";
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
import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { useMessageReactions } from "@/hooks/use-message-reactions";

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
      {/* Main content layout */}
      <div className="flex items-start gap-2">
        {/* Menu for own messages */}
        {isOwn && (
          <div className="pt-2">
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
                {canDelete && (
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive hover:text-destructive" 
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </DropdownMenuItem>
                )}
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 text-sm cursor-pointer"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Smile className="mr-2 h-4 w-4" />
                      <span>Add Reaction</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-auto border-none shadow-lg"
                    align="start"
                    sideOffset={5}
                    side="right"
                  >
                    <div className="bg-popover border rounded-md shadow-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Choose an emoji</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEmojiPickerOpen(false)}
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
                  </PopoverContent>
                </Popover>
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
                {canDelete && (
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive hover:text-destructive" 
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </DropdownMenuItem>
                )}
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 text-sm cursor-pointer"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Smile className="mr-2 h-4 w-4" />
                      <span>Add Reaction</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-auto border-none shadow-lg"
                    align="end"
                    sideOffset={5}
                    side="left"
                  >
                    <div className="bg-popover border rounded-md shadow-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Choose an emoji</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEmojiPickerOpen(false)}
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
                  </PopoverContent>
                </Popover>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
