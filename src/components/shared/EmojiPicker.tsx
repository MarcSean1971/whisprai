
import { X, Smile } from "lucide-react";
import EmojiPickerReact from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="p-0 w-auto border shadow-lg max-w-[350px]">
        <div className="bg-popover rounded-md p-4">
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
      </DialogContent>
    </Dialog>
  );
}
