
import { Smile } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useRef, useState } from "react";
import { EmojiFloatingPanel } from "./EmojiFloatingPanel";

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
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // We open the floating panel when this submenu is clicked
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Get the bounding rect of the submenu trigger button
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setAnchorRect(rect);
    }
    setFloatingOpen(true);
  };

  const handleClose = () => {
    setFloatingOpen(false);
    if (onAfterClose) onAfterClose();
  };

  const handleSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    handleClose();
  };

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className="flex items-center px-2 py-1.5 rounded-sm cursor-pointer gap-2 w-full outline-none focus:bg-accent"
          onClick={handleTriggerClick}
        >
          <Smile className="mr-2 h-4 w-4" />
          <span>Add Reaction</span>
        </DropdownMenuSubTrigger>
        {/* Don't render submenu content—picker is rendered in portal as panel */}
      </DropdownMenuSub>
      <EmojiFloatingPanel
        anchorRect={anchorRect}
        open={floatingOpen}
        onOpenChange={open => {
          setFloatingOpen(open);
          if (!open) handleClose();
        }}
        onEmojiSelect={handleSelect}
        width={300}
        height={350}
      />
    </>
  );
}
