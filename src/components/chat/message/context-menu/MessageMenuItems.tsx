
import { Reply, Languages, Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { toast } from "sonner";

interface MessageMenuItemsProps {
  onReply: () => void;
  onToggleTranslation?: () => void;
  showTranslationToggle?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
  messageId: string;
}

export function MessageMenuItems({
  onReply,
  onToggleTranslation,
  showTranslationToggle,
  onDelete,
  canDelete,
  isDeleting,
  messageId
}: MessageMenuItemsProps) {
  const { addReaction } = useMessageReactions(messageId);
  
  const handleEmojiSelect = (emojiData: any) => {
    console.log('Emoji selected:', emojiData);
    try {
      addReaction({ emoji: emojiData.emoji });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  return (
    <>
      <DropdownMenuItem className="cursor-pointer" onClick={onReply}>
        <Reply className="mr-2 h-4 w-4" />
        <span>Reply</span>
      </DropdownMenuItem>
      
      <EmojiPickerPopover 
        onEmojiSelect={handleEmojiSelect}
        side="right"
        align="start"
      />
      
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
    </>
  );
}
