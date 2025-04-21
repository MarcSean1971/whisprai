
import EmojiPickerReact from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emojiData: any) => void;
  triggerButton: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  height?: number;
  align?: "center" | "start" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

export function EmojiPicker({
  onEmojiSelect,
  triggerButton,
  open,
  onOpenChange,
  width = 300,
  height = 350,
  align = "center",
  side = "bottom",
  sideOffset = 4
}: EmojiPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="p-0 w-auto border shadow-lg max-w-[350px] z-[9999] bg-popover"
        style={{ minWidth: width, minHeight: height }}
      >
        <div className="bg-popover rounded-md p-2">
          <EmojiPickerReact
            width={width}
            height={height}
            onEmojiClick={onEmojiSelect}
            lazyLoadEmojis={true}
            skinTonesDisabled={false}
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
