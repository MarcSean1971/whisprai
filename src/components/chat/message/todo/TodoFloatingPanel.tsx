
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
      if (!panelRef.current) return;

      const target = event.target as HTMLElement;

      // Check for Radix UI popover and select elements
      const isRadixPopover = target.closest('[data-radix-popper-content-wrapper]');
      const isRadixSelect = target.closest('[role="listbox"]');
      
      // Check for date picker elements
      const isDatePicker = target.closest('.rdp');
      const isDatePickerButton = target.closest('[data-radix-popover-trigger]');
      
      // Don't close if clicking within interactive elements
      if (isRadixPopover || isRadixSelect || isDatePicker || isDatePickerButton) {
        return;
      }

      // Check if click was outside the panel
      if (!panelRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside, true);
    };
  }, [open, onOpenChange]);

  if (!open || !anchorRect) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: Math.min(anchorRect.right + 8, window.innerWidth - 400),
        top: Math.max(Math.min(anchorRect.top, window.innerHeight - 400), 12),
        zIndex: 99999,
        minWidth: 400,
        minHeight: 300,
      }}
      className="bg-background rounded-lg border shadow-lg"
    >
      <TodoDialog
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
      />
    </div>,
    document.body
  );
}
