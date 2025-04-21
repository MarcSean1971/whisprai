
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
  if (
    typeof window !== "undefined" &&
    document.activeElement instanceof HTMLElement
  ) {
    document.activeElement.blur();
  }
}

// NEW: Utility to forcibly remove ALL dialog overlays if present (fixes stuck overlays)
function forceRemoveAllDialogOverlays() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const overlays = document.querySelectorAll('.radix-dialog-overlay,[data-radix-dialog-overlay],[data-state="open"].fixed.bg-black\\/80');
    overlays.forEach(overlay => {
      // Remove from DOM if possible
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  }
}

export function EmojiPicker({
  onEmojiSelect,
  triggerButton,
  open,
  onOpenChange,
}: EmojiPickerProps) {
  const justClosedRef = useRef(false);

  const safeClose = () => {
    if (!justClosedRef.current) {
      justClosedRef.current = true;
      onOpenChange(false);
      // After dialog attempts to close, forcibly remove overlays
      setTimeout(() => {
        forceRemoveAllDialogOverlays();
      }, 10);
      console.log("[EmojiPicker] Dialog closed");
    }
  };

  useEffect(() => {
    if (!open) {
      justClosedRef.current = false;
      forceBlurActiveElement();
      setTimeout(() => {
        forceRemoveAllDialogOverlays();
      }, 10);
    } else {
      console.log("[EmojiPicker] Dialog opened");
    }
  }, [open]);

  const handleEmojiSelect = (emojiData: any) => {
    // Immediately close dialog FIRST to remove overlay instantly
    safeClose();
    // (Make sure no modal overlay blocks remain before fulfilling side effects)
    setTimeout(() => {
      forceBlurActiveElement();
      forceRemoveAllDialogOverlays();
      onEmojiSelect(emojiData);
      console.log('[EmojiPicker] Emoji selected in picker:', emojiData);
    }, 10);
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
