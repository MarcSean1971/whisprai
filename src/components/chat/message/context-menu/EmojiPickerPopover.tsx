
import { Smile } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useRef } from "react";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
  onAfterClose?: () => void;
}

// All these props are passed through from MessageMenuItems
export function EmojiPickerPopover({
  onEmojiSelect,
  align = "start",
  side = "right", // Open submenu to the right
  onAfterClose,
}: EmojiPickerPopoverProps) {
  // We use a ref to track the EmojiPicker submenu content so escape closes only it
  const pickerRef = useRef<HTMLDivElement>(null);

  // When the user picks an emoji, call parent and close dropdown
  const handleSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    // Trick: Normally, Radix closes all menus on click, but emoji-picker handles that by bubbling.
    // We also trigger onAfterClose if parent wants.
    if (onAfterClose) onAfterClose();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger inset>
        <Smile className="mr-2 h-4 w-4" />
        <span>Add Reaction</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        ref={pickerRef}
        className="p-0 w-auto border shadow-lg max-w-[350px] z-[9999] bg-popover"
        style={{ minWidth: 300, minHeight: 350 }}
      >
        <div className="bg-popover rounded-md p-2">
          <EmojiPicker
            onEmojiSelect={handleSelect}
            triggerButton={null}
            open={true}
            onOpenChange={() => {}} // No-op, controlled by dropdown
            width={300}
            height={350}
            align={align}
            side={side}
            sideOffset={4}
          />
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
