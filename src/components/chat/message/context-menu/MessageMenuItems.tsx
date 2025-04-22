import { Reply, Languages, Trash2, ListTodo } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { toast } from "sonner";
import { TodoFloatingPanel } from "../todo/TodoFloatingPanel";
import { useState, useRef } from "react";
import { useTodos } from "@/hooks/use-todos";

interface MessageMenuItemsProps {
  onReply: () => void;
  onToggleTranslation?: () => void;
  showTranslationToggle?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
  messageId: string;
  onCloseMenu: () => void;
}

export function MessageMenuItems({
  onReply,
  onToggleTranslation,
  showTranslationToggle,
  onDelete,
  canDelete,
  isDeleting,
  messageId,
  onCloseMenu
}: MessageMenuItemsProps) {
  const { addReaction } = useMessageReactions(messageId);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const todoButtonRef = useRef<HTMLDivElement>(null);
  const { createTodo } = useTodos();

  const handleEmojiSelect = async (emojiData: any) => {
    try {
      await addReaction({ emoji: emojiData.emoji });
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
    onCloseMenu();
  };

  const handleAddTodo = (assignedTo: string, dueDate: Date) => {
    createTodo({
      message_id: messageId,
      assigned_to: assignedTo,
      due_date: dueDate,
      conversation_id: window.location.pathname.split('/').pop() || '',
    });
    // First set the dialog state to false
    setTodoDialogOpen(false);
    // Then close the parent menu
    onCloseMenu();
  };

  const handleTodoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (todoButtonRef.current) {
      const rect = todoButtonRef.current.getBoundingClientRect();
      setAnchorRect(rect);
      setTodoDialogOpen(true);
    }
  };

  return (
    <>
      <DropdownMenuItem className="cursor-pointer" onClick={() => {
        onReply();
        onCloseMenu();
      }}>
        <Reply className="mr-2 h-4 w-4" />
        <span>Reply</span>
      </DropdownMenuItem>

      <div ref={todoButtonRef}>
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={handleTodoClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ListTodo className="mr-2 h-4 w-4" />
          <span>Add to Todo List</span>
        </DropdownMenuItem>
      </div>

      <EmojiPickerPopover
        onEmojiSelect={handleEmojiSelect}
        onAfterClose={onCloseMenu}
      />

      {showTranslationToggle && (
        <DropdownMenuItem className="cursor-pointer" onClick={() => {
          onToggleTranslation?.();
          onCloseMenu();
        }}>
          <Languages className="mr-2 h-4 w-4" />
          <span>Toggle Translation</span>
        </DropdownMenuItem>
      )}

      {canDelete && (
        <DropdownMenuItem
          className="cursor-pointer text-destructive hover:text-destructive"
          onClick={() => {
            onDelete?.();
            onCloseMenu();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete"}</span>
        </DropdownMenuItem>
      )}

      <TodoFloatingPanel 
        anchorRect={anchorRect}
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSubmit={handleAddTodo}
        onCloseMenu={onCloseMenu}
      />
    </>
  );
}
