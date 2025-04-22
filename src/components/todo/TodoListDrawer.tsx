
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TodoList } from "./TodoList";

interface TodoListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoListDrawer({ open, onOpenChange }: TodoListDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Todo List</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <TodoList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
