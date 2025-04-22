
import { Button } from "@/components/ui/button";
import { ListTodo } from "lucide-react";

interface TodoListButtonProps {
  onClick: () => void;
}

export function TodoListButton({ onClick }: TodoListButtonProps) {
  return (
    <Button 
      variant="ghost" 
      className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
      onClick={onClick}
    >
      <ListTodo className="h-5 w-5" />
      <span className="text-xs truncate">Tasks</span>
    </Button>
  );
}
