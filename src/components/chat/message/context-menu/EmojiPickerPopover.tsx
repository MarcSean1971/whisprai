
import { Smile } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useState } from "react";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  align?: "start" | "end";
  side?: "left" | "right";
}

export function EmojiPickerPopover({
  onEmojiSelect,
  align = "start",
  side = "right"
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // When emoji is chosen, call the parent handler, but only close after selection or explicit close
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    // The menu will close from EmojiPicker's onEmojiSelect after selection or via explicit Close
    // No need to set isOpen(false) here directly—handled inside EmojiPicker
  };

  // Use DropdownMenuItem as the trigger for opening the popover
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
      onOpenChange={setIsOpen}
    />
  );
}
