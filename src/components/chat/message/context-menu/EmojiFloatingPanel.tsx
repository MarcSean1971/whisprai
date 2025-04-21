
import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

interface EmojiFloatingPanelProps {
  anchorRect: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emojiData: any) => void;
  width?: number;
  height?: number;
}

export function EmojiFloatingPanel({
  anchorRect,
  open,
  onOpenChange,
  onEmojiSelect,
  width = 300,
  height = 350
}: EmojiFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    // Use capture phase to detect clicks before they propagate
    document.addEventListener("mousedown", onClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside, true);
    };
  }, [open, onOpenChange]);

  // Calculate panel position based on anchor rect (submenu button)
  const style: React.CSSProperties = {};
  if (anchorRect) {
    style.position = "fixed";
    style.left = Math.min(
      anchorRect.right + 8,
      window.innerWidth - width - 12
    );
    style.top = Math.max(
      Math.min(anchorRect.top, window.innerHeight - height - 12),
      12
    );
    style.zIndex = 99999;
    style.minWidth = width;
    style.minHeight = height;
    style.pointerEvents = "auto"; // ensure pointer events enabled for the panel
  }

  if (!open || !anchorRect) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="rounded-md border shadow-lg"
      style={style}
      tabIndex={-1}
      // Remove p-2 and any overlay/background on the wrapper!
      onMouseDown={e => {
        // Prevent mouse events inside panel from closing it
        e.stopPropagation();
      }}
    >
      {/* Give EmojiPicker a real background, no overlay */}
      <div
        className="bg-popover rounded-md"
        style={{
          width: width,
          minWidth: width,
          minHeight: height,
          background: "#221F26", // solid dark background for emoji panel
        }}
      >
        <EmojiPicker
          onEmojiSelect={emoji => {
            onEmojiSelect(emoji);
            onOpenChange(false);
          }}
          triggerButton={null}
          open={true}
          onOpenChange={onOpenChange}
          width={width}
          height={height}
          align="center"
          side="bottom"
          sideOffset={4}
          hideOverlay={true}
        />
      </div>
    </div>,
    document.body
  );
}
