
import { X, Smile } from "lucide-react";
import EmojiPickerReact from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emojiData: any) => void;
  triggerButton?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmojiPicker({
  onEmojiSelect,
  triggerButton,
  side = "top",
  align = "start",
  sideOffset = 5,
  open,
  onOpenChange
}: EmojiPickerProps) {
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const defaultTrigger = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:text-foreground"
      onClick={() => onOpenChange(true)}
    >
      <Smile className="h-5 w-5" />
      <span className="sr-only">Add emoji</span>
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {triggerButton || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto border-none shadow-lg" 
        side={side}
        align={align}
        sideOffset={sideOffset}
        hideWhenDetached={false}
      >
        <div className="bg-popover border rounded-md shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Choose an emoji</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <EmojiPickerReact
            width={300}
            height={350}
            onEmojiClick={handleEmojiSelect}
            lazyLoadEmojis={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
