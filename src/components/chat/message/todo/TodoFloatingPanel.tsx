
import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { TodoDialog } from "./TodoDialog";

interface TodoFloatingPanelProps {
  anchorRect: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (assignedTo: string, dueDate: Date) => void;
}

export function TodoFloatingPanel({
  anchorRect,
  open,
  onOpenChange,
  onSubmit,
}: TodoFloatingPanelProps) {
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

    document.addEventListener("mousedown", onClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside, true);
    };
  }, [open, onOpenChange]);

  if (!open || !anchorRect) return null;

  // Calculate panel position based on anchor rect
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorRect.right + 8, window.innerWidth - 400),
    top: Math.max(Math.min(anchorRect.top, window.innerHeight - 400), 12),
    zIndex: 99999,
    minWidth: 400,
    minHeight: 300,
    pointerEvents: "auto", // Critical for interaction
  };

  return createPortal(
    <div
      ref={panelRef}
      className="rounded-md border shadow-lg bg-popover"
      style={style}
      tabIndex={-1}
      onMouseDown={e => {
        // Prevent mousedown inside panel from closing it
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-popover rounded-md"
        style={{ background: "#221F26" }} // solid dark background
      >
        <TodoDialog
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
        />
      </div>
    </div>,
    document.body
  );
}
