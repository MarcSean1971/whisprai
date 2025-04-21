
import { Smile } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useState } from "react";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  align?: "start" | "end";
  side?: "left" | "right";
  onAfterClose?: () => void; // NEW: callback for after picker closes
}

export function EmojiPickerPopover({
  onEmojiSelect,
  align = "start",
  side = "right",
  onAfterClose, // NEW: callback for menu closure
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // When emoji is chosen, call parent handler. Picker will close via onOpenChange.
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    // Picker will call onOpenChange(false) afterwards
  };

  // Fire callback to close parent dropdown menu after picker closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onAfterClose) {
      setTimeout(() => {
        onAfterClose();
      }, 75); // Short delay to allow dialog UI to finish
    }
  };

  const triggerButton = (
    <DropdownMenuItem
      className="cursor-pointer"
      onSelect={(e) => {
        e.preventDefault();
        setIsOpen(true);
      }}
    >
      <Smile className="mr-2 h-4 w-4" />
      <span>Add Reaction</span>
    </DropdownMenuItem>
  );

  return (
    <EmojiPicker
      onEmojiSelect={handleEmojiSelect}
      triggerButton={triggerButton}
      side={side}
      align={align}
      sideOffset={5}
      open={isOpen}
      onOpenChange={handleOpenChange}
    />
  );
}
