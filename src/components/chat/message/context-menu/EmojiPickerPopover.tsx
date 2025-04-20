
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

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
  const triggerButton = (
    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
      <Smile className="mr-2 h-4 w-4" />
      <span>Add Reaction</span>
    </DropdownMenuItem>
  );

  return (
    <EmojiPicker
      onEmojiSelect={onEmojiSelect}
      triggerButton={triggerButton}
      side={side}
      align={align}
      sideOffset={5}
    />
  );
}
