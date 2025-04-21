
import { Smile } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useRef, useState } from "react";

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
  // Use internal state to open/close the emoji picker inside the dropdown sub-menu
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // When the user picks an emoji, call parent and close dropdown
  const handleSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    setOpen(false);
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
          {/* Pass hideOverlay so it doesn't render an overlay */}
          <EmojiPicker
            onEmojiSelect={handleSelect}
            triggerButton={null}
            open={open}
            onOpenChange={setOpen}
            width={300}
            height={350}
            align={align}
            side={side}
            sideOffset={4}
            hideOverlay={true}
          />
          {/* Show a button to open the Emoji picker if not already open */}
          {!open && (
            <button
              className="flex items-center justify-center w-full h-10 rounded hover:bg-accent text-muted-foreground"
              onClick={() => setOpen(true)}
              tabIndex={0}
              type="button"
            >
              <Smile className="h-5 w-5 mx-2" />
              <span>Pick emoji</span>
            </button>
          )}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
