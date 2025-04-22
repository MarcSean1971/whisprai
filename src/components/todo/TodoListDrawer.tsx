
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TodoList } from "./TodoList";

interface TodoListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoListDrawer({ open, onOpenChange }: TodoListDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Todo List</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <TodoList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
