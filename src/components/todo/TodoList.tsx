import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./TodoItem";
import { TodoListFilters, TodoFilter } from "./TodoListFilters";
import { useState } from "react";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { useProfile } from "@/hooks/use-profile";

export function TodoList() {
  const { todos, isLoading, updateTodoStatus, updateTodo, deleteTodo } = useTodos();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TodoFilter>({
    status: 'all',
    dueDate: 'all',
    assignee: 'all'
  });
  const { profile } = useProfile();

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

  const filterTodos = (todos: any[]) => {
    return todos.filter(todo => {
      const messageContent = todo.messages?.content || todo.message_content;
      if (searchQuery && !messageContent?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filter.status !== 'all' && todo.status !== filter.status) {
        return false;
      }

      if (filter.dueDate !== 'all') {
        const dueDate = new Date(todo.due_date);
        if (filter.dueDate === 'today' && !isToday(dueDate)) return false;
        if (filter.dueDate === 'week' && !isThisWeek(dueDate)) return false;
        if (filter.dueDate === 'month' && !isThisMonth(dueDate)) return false;
      }

      if (filter.assignee !== 'all') {
        if (filter.assignee === 'me' && todo.assigned_to !== profile?.id) return false;
        if (filter.assignee === 'others' && todo.assigned_to === profile?.id) return false;
      }

      return true;
    });
  };

  const filteredTodos = filterTodos(todos);
  const pendingTodos = filteredTodos.filter(todo => todo.status === 'pending');
  const completedTodos = filteredTodos.filter(todo => todo.status === 'completed');

  return (
    <div className="space-y-2">
      <TodoListFilters 
        onSearchChange={setSearchQuery}
        onFilterChange={setFilter}
      />

      <div className="space-y-6 p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Pending ({pendingTodos.length})</h3>
          <div className="space-y-2">
            {pendingTodos.map((todo) => (
              <TodoItem 
                key={todo.id} 
                todo={todo}
                onStatusChange={(id, status) => {
                  updateTodoStatus({ id, status });
                }}
                onUpdate={(id, data) => {
                  updateTodo({ id, ...data });
                }}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        </div>

        {completedTodos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Completed ({completedTodos.length})</h3>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo}
                  onStatusChange={(id, status) => {
                    updateTodoStatus({ id, status });
                  }}
                  onUpdate={(id, data) => {
                    updateTodo({ id, ...data });
                  }}
                  onDelete={deleteTodo}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
