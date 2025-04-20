
import { Reply, Languages, Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface MessageMenuItemsProps {
  onReply: () => void;
  onToggleTranslation?: () => void;
  showTranslationToggle?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export function MessageMenuItems({
  onReply,
  onToggleTranslation,
  showTranslationToggle,
  onDelete,
  canDelete,
  isDeleting
}: MessageMenuItemsProps) {
  return (
    <>
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
    </>
  );
}
