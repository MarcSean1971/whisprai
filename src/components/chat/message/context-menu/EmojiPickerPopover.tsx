
import { Smile } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  align?: "start" | "end";
  side?: "left" | "right";
  onAfterClose?: () => void;
}

export function EmojiPickerPopover({
  onEmojiSelect,
  onAfterClose,
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // The trigger button for the popover, styled as a dropdown item.
  const triggerButton = (
    <DropdownMenuItem
      className="cursor-pointer flex items-center"
      onSelect={(e) => {
        e.preventDefault();
        setIsOpen(true);
      }}
    >
      <Smile className="mr-2 h-4 w-4" />
      <span>Add Reaction</span>
    </DropdownMenuItem>
  );

  // This closes both the popover and the parent dropdown menu.
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    setIsOpen(false);
    if (onAfterClose) onAfterClose();
  };

  return (
    <EmojiPicker
      onEmojiSelect={handleEmojiSelect}
      triggerButton={triggerButton}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open && onAfterClose) onAfterClose();
      }}
      width={300}
      height={350}
    />
  );
}
