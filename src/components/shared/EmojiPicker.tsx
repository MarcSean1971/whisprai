
import EmojiPickerReact from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React, { useRef } from "react";

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
  hideOverlay?: boolean;
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
  sideOffset = 4,
  hideOverlay = false
}: EmojiPickerProps) {
  // To prevent overlay click from triggering when click is inside popover
  const popoverRef = useRef<HTMLDivElement>(null);

  // Overlay click handler: only closes if click is outside emoji picker
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(event.target as Node)
    ) {
      onOpenChange(false);
    }
  };

  // When an emoji is picked, immediately close
  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData);
    onOpenChange(false);
  };

  // If triggerButton is null, render only the picker content (for use in floating panel)
  if (triggerButton === null) {
    return (
      <div
        className="bg-popover rounded-md"
        style={{ width, minWidth: width, minHeight: height }}
        // <=== KEY: prevent mousedown in picker from closing popover
        onMouseDown={e => e.stopPropagation()}
      >
        <EmojiPickerReact
          width={width}
          height={height}
          onEmojiClick={handleEmojiSelect}
          lazyLoadEmojis={true}
          skinTonesDisabled={false}
          searchDisabled={false}
          previewConfig={{ showPreview: false }}
        />
      </div>
    );
  }

  return (
    <>
      {/* ONLY render overlay unless we're inside dropdown (hideOverlay=true) */}
      {!hideOverlay && open && (
        <div
          aria-label="Emoji picker overlay"
          className="fixed inset-0 bg-black/40 z-[9998]"
          onMouseDown={handleOverlayClick}
          tabIndex={-1}
        />
      )}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent
          ref={popoverRef}
          align={align}
          side={side}
          sideOffset={sideOffset}
          className="p-0 w-auto border shadow-lg max-w-[350px] z-[9999] bg-popover"
          style={{ minWidth: width, minHeight: height }}
          // <=== KEY: prevent mousedown in picker content from closing popover
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="bg-popover rounded-md p-2">
            <EmojiPickerReact
              width={width}
              height={height}
              onEmojiClick={handleEmojiSelect}
              lazyLoadEmojis={true}
              skinTonesDisabled={false}
              searchDisabled={false}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

