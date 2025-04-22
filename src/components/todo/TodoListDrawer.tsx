
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TodoList } from "./TodoList";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TodoListFilters } from "./TodoListFilters";

interface TodoListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoListDrawer({ open, onOpenChange }: TodoListDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 gap-0 overflow-hidden">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>Todo List</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 min-h-0">
          <div className="w-full flex flex-col overflow-hidden">
            <TodoList />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
