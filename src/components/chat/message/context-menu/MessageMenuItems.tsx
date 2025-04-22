import { Reply, Languages, Trash2, ListTodo } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { toast } from "sonner";
import { TodoDialog } from "../todo/TodoDialog";
import { useState } from "react";
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
    onCloseMenu();
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

      <DropdownMenuItem className="cursor-pointer" onClick={() => {
        setTodoDialogOpen(true);
        onCloseMenu();
      }}>
        <ListTodo className="mr-2 h-4 w-4" />
        <span>Add to Todo List</span>
      </DropdownMenuItem>

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

      <TodoDialog 
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSubmit={handleAddTodo}
      />
    </>
  );
}
