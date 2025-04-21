
import { X, Smile } from "lucide-react";
import EmojiPickerReact from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useRef } from "react";

interface EmojiPickerProps {
  onEmojiSelect: (emojiData: any) => void;
  triggerButton?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Utility to blur any active element (fixes pointer-event trapping by modal overlay)
function forceBlurActiveElement() {
  if (typeof window !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export function EmojiPicker({
  onEmojiSelect,
  triggerButton,
  open,
  onOpenChange
}: EmojiPickerProps) {
  const justClosedRef = useRef(false);

  // This ensures onOpenChange(false) is only called once per close
  const safeClose = () => {
    if (!justClosedRef.current) {
      justClosedRef.current = true;
      // Blur any elements to release pointer events
      forceBlurActiveElement();
      onOpenChange(false);
      console.log("[EmojiPicker] Dialog closed");
    }
  };

  useEffect(() => {
    if (!open) {
      // UI is closed, allow next close again
      justClosedRef.current = false;
      // Extra safety for overlay focus bugs
      forceBlurActiveElement();
    } else {
      console.log("[EmojiPicker] Dialog opened");
    }
  }, [open]);

  const handleEmojiSelect = (emojiData: any) => {
    console.log('[EmojiPicker] Emoji selected in picker:', emojiData);
    onEmojiSelect(emojiData);
    // Defensive: blur so overlay can't trap focus/events.
    forceBlurActiveElement();
    // Close dialog instantly
    safeClose();
  };

  const handleClose = () => {
    safeClose();
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
      <DialogContent
        className="p-0 w-auto border shadow-lg max-w-[350px]"
        // Defensive: remove pointer events if overlay buggy
        style={{ pointerEvents: open ? "auto" : "none", zIndex: 99999 }}
        data-testid="emoji-dialog-content"
      >
        <DialogTitle>
          <VisuallyHidden>Choose an emoji</VisuallyHidden>
        </DialogTitle>
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
          {open && (
            <EmojiPickerReact
              width={300}
              height={350}
              onEmojiClick={handleEmojiSelect}
              lazyLoadEmojis={true}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

