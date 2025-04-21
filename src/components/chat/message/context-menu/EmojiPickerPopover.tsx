
import { Smile } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useState, useEffect } from "react";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  align?: "start" | "end";
  side?: "left" | "right";
  onAfterClose?: () => void;
}

export function EmojiPickerPopover({
  onEmojiSelect,
  align = "start",
  side = "right",
  onAfterClose,
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // When emoji is chosen, call parent handler
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    // We don't need to call setIsOpen(false) here as the picker will call onOpenChange
  };

  // Ensures dropdown closes immediately after picker closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (!open && onAfterClose) {
      // Small delay to ensure all UI updates have processed
      setTimeout(() => {
        onAfterClose();
      }, 50);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // If component unmounts while open, ensure we call the after close handler
      if (isOpen && onAfterClose) {
        onAfterClose();
      }
    };
  }, [isOpen, onAfterClose]);

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
