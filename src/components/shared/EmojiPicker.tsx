
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
import { useEffect, useRef, useState } from "react";

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

// Safer overlay cleanup approach that doesn't directly remove DOM nodes
// but hides them and marks them for cleanup
function safeHideOverlays() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const selectors = [
      '.radix-dialog-overlay',
      '[data-radix-dialog-overlay]',
      '.radix-alert-dialog-overlay',
      '[data-radix-alert-dialog-overlay]',
      '[data-state="open"].fixed.bg-black\\/80',
      '.radix-dropdown-menu-content',
      '[data-radix-popper-content-wrapper]',
      '[data-side][data-state="open"].z-50',
      '.fixed.z-50.bg-black\\/80',
      '[data-state="open"].z-50',
    ];
    
    const overlays = document.querySelectorAll(selectors.join(','));
    
    overlays.forEach(overlay => {
      // Instead of removing, hide with pointer-events: none and opacity: 0
      // Let React handle the actual removal
      if (overlay instanceof HTMLElement) {
        console.log("[EmojiPicker] Hiding overlay:", overlay);
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
        overlay.style.visibility = "hidden";
        
        // Add a class we can identify later
        overlay.classList.add("emoji-picker-cleaned");
        
        // Set data attribute to mark as processed
        overlay.setAttribute("data-emoji-picker-processed", "true");
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
  const [internalOpen, setInternalOpen] = useState(open);
  
  // Sync internal state with external state
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const safeClose = () => {
    if (!justClosedRef.current) {
      justClosedRef.current = true;
      
      // First hide overlays
      safeHideOverlays();
      
      // Then update state
      setInternalOpen(false);
      onOpenChange(false);
      
      console.log("[EmojiPicker] Dialog closed");
    }
  };

  useEffect(() => {
    if (!internalOpen) {
      justClosedRef.current = false;
      forceBlurActiveElement();
      safeHideOverlays();
    } else {
      console.log("[EmojiPicker] Dialog opened");
    }
  }, [internalOpen]);

  // Add a global event listener to handle clicks after an emoji is selected
  useEffect(() => {
    const handleGlobalClick = () => {
      // Check if there are any invisible overlays left and hide them
      const processedOverlays = document.querySelectorAll('[data-emoji-picker-processed="true"]');
      if (processedOverlays.length > 0) {
        console.log("[EmojiPicker] Cleanup on global click, found:", processedOverlays.length, "overlays");
        processedOverlays.forEach(overlay => {
          if (overlay instanceof HTMLElement) {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            overlay.style.visibility = "hidden";
          }
        });
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleEmojiSelect = (emojiData: any) => {
    // First hide overlays safely
    safeHideOverlays();
    
    // Then close dialog through state updates
    safeClose();
    
    // Wait a bit for React to process state changes before calling callback
    setTimeout(() => {
      forceBlurActiveElement();
      onEmojiSelect(emojiData);
      console.log('[EmojiPicker] Emoji selected in picker:', emojiData);
    }, 50);
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
    <Dialog open={internalOpen} onOpenChange={(state) => {
      setInternalOpen(state);
      onOpenChange(state);
    }}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="p-0 w-auto border shadow-lg max-w-[350px]"
        style={{ 
          pointerEvents: internalOpen ? "auto" : "none", 
          zIndex: 99999 
        }}
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
          {internalOpen && (
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
