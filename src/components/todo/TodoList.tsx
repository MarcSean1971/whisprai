
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const { todos, isLoading, updateTodoStatus } = useTodos();

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading todos...</div>;
  }

  if (!todos?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No todos yet. Create one by clicking the todo icon in any message.
      </div>
    );
  }

  const pendingTodos = todos.filter(todo => todo.status === 'pending');
  const completedTodos = todos.filter(todo => todo.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Pending ({pendingTodos.length})</h3>
        <div className="space-y-1">
          {pendingTodos.map((todo) => (
            <TodoItem 
              key={todo.id} 
              todo={todo}
              onStatusChange={(id, status) => {
                updateTodoStatus({ id, status });
              }}
            />
          ))}
        </div>
      </div>

      {completedTodos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Completed ({completedTodos.length})</h3>
          <div className="space-y-1">
            {completedTodos.map((todo) => (
              <TodoItem 
                key={todo.id} 
                todo={todo}
                onStatusChange={(id, status) => {
                  updateTodoStatus({ id, status });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
