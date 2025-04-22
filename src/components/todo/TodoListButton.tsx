
import { Button } from "@/components/ui/button";
import { ListTodo } from "lucide-react";

interface TodoListButtonProps {
  onClick: () => void;
}

export function TodoListButton({ onClick }: TodoListButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick}
      className="flex items-center gap-2 px-3"
    >
      <ListTodo className="h-4 w-4" />
      <span className="text-sm hidden sm:inline">Tasks</span>
    </Button>
  );
}
