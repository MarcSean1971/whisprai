
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
      // Check if click was outside the panel
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
      }
    }

    // Use capture phase to handle clicks before they propagate
    document.addEventListener("mousedown", onClickOutside, true);
    
    // Focus the panel when it opens
    if (panelRef.current) {
      panelRef.current.focus();
    }

    return () => {
      document.removeEventListener("mousedown", onClickOutside, true);
    };
  }, [open, onOpenChange]);

  if (!open || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorRect.right + 8, window.innerWidth - 400),
    top: Math.max(Math.min(anchorRect.top, window.innerHeight - 400), 12),
    zIndex: 99999,
    minWidth: 400,
    minHeight: 300,
  };

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      tabIndex={-1}
      onMouseDown={(e) => {
        // Prevent click from propagating to parent elements
        e.stopPropagation();
      }}
    >
      <TodoDialog
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
      />
    </div>,
    document.body
  );
}
