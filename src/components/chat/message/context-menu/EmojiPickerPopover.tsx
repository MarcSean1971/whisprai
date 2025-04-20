
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "end";
  side?: "left" | "right";
}

export function EmojiPickerPopover({
  onEmojiSelect,
  align = "start",
  side = "right"
}: EmojiPickerPopoverProps) {
  const triggerButton = (
    <Button
      variant="ghost"
      className="w-full justify-start p-2 text-sm cursor-pointer"
      onClick={(e) => e.preventDefault()}
    >
      <Smile className="mr-2 h-4 w-4" />
      <span>Add Reaction</span>
    </Button>
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
