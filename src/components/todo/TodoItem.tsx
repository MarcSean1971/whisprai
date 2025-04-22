
import { Todo } from "@/hooks/use-todos";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface TodoItemProps {
  todo: Todo;
  onStatusChange: (id: string, status: 'pending' | 'completed') => void;
}

export function TodoItem({ todo, onStatusChange }: TodoItemProps) {
  const formattedDate = format(new Date(todo.due_date), 'MMM d, yyyy');
  
  return (
    <div className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg">
      <Checkbox
        checked={todo.status === 'completed'}
        onCheckedChange={(checked) => {
          onStatusChange(todo.id, checked ? 'completed' : 'pending');
        }}
      />
      <div className="flex-1 space-y-1">
        <p className={`text-sm ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
          {todo.message_id}
        </p>
        <p className="text-xs text-muted-foreground">
          Due: {formattedDate}
        </p>
      </div>
    </div>
  );
}
