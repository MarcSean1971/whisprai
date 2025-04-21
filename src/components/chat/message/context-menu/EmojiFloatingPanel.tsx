
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
  }

  if (!open || !anchorRect) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="bg-popover rounded-md p-2 border shadow-lg"
      style={style}
      tabIndex={-1}
      onMouseDown={e => {
        // Prevent mouse events (click, scroll, drag, selection, scrollbar) inside panel from closing it
        e.stopPropagation();
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
    </div>,
    document.body
  );
}
