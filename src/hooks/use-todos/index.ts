
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchTodos } from "./queries";
import { createTodo, updateTodoStatus, updateTodo, deleteTodo } from "./mutations";
import type { CreateTodoInput, UpdateTodoInput, EnrichedTodo } from "./types";

export type { Todo, CreateTodoInput, UpdateTodoInput, EnrichedTodo } from "./types";

export function useTodos() {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const createTodoMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo created successfully');
    },
    onError: (error) => {
      console.error('Error creating todo:', error);
      toast.error('Failed to create todo');
    },
  });

  const updateTodoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'completed' }) => updateTodoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo status updated');
    },
    onError: (error) => {
      console.error('Error updating todo status:', error);
      toast.error('Failed to update todo status');
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo updated successfully');
    },
    onError: (error) => {
      console.error('Error updating todo:', error);
      toast.error('Failed to update todo');
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    },
  });

  return {
    todos,
    isLoading,
    createTodo: createTodoMutation.mutate,
    updateTodoStatus: updateTodoStatusMutation.mutate,
    updateTodo: updateTodoMutation.mutate,
    deleteTodo: deleteTodoMutation.mutate,
  };
}
