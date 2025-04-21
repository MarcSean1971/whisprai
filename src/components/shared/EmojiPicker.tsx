
import EmojiPickerReact from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emojiData: any) => void;
  triggerButton: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  height?: number;
}

export function EmojiPicker({
  onEmojiSelect,
  triggerButton,
  open,
  onOpenChange,
  width = 300,
  height = 350
}: EmojiPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        align="start"
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
