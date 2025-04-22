
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./TodoItem";
import { TodoListFilters, TodoFilter } from "./TodoListFilters";
import { useState } from "react";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search todos..."
            className="pl-8 w-full"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <TodoListFilters 
          onSearchChange={setSearchQuery}
          onFilterChange={setFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-medium flex items-center justify-between">
            Pending
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {pendingTodos.length}
            </span>
          </h3>
          <div className="space-y-3">
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
        </Card>

        {completedTodos.length > 0 && (
          <Card className="p-4 space-y-4 bg-muted/50">
            <h3 className="text-sm font-medium flex items-center justify-between">
              Completed
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {completedTodos.length}
              </span>
            </h3>
            <div className="space-y-3">
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
          </Card>
        )}
      </div>
    </div>
  );
}
