
import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { TodoDialog } from "./TodoDialog";

interface TodoFloatingPanelProps {
  anchorRect: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (assignedTo: string, dueDate: Date) => void;
  onCloseMenu?: () => void;
}

export function TodoFloatingPanel({
  anchorRect,
  open,
  onOpenChange,
  onSubmit,
  onCloseMenu = () => {},
}: TodoFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('[data-radix-popper-content-wrapper]')
      ) {
        onOpenChange(false);
        onCloseMenu();
      }
    }

    document.addEventListener("mousedown", onClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside, true);
    };
  }, [open, onOpenChange, onCloseMenu]);

  if (!open || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorRect.right + 8, window.innerWidth - 400),
    top: Math.max(Math.min(anchorRect.top, window.innerHeight - 400), 12),
    zIndex: 99999,
    minWidth: 400,
    minHeight: 300,
    pointerEvents: "auto",
    background: "#221F26",
  };

  return createPortal(
    <div
      ref={panelRef}
      className="rounded-md border shadow-lg bg-popover"
      style={style}
      tabIndex={-1}
    >
      <TodoDialog
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
        onCloseMenu={onCloseMenu}
      />
    </div>,
    document.body
  );
}
