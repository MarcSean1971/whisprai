
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Todo {
  id: string;
  message_id: string;
  creator_id: string;
  assigned_to: string;
  due_date: string;
  conversation_id: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

interface CreateTodoInput {
  message_id: string;
  assigned_to: string;
  due_date: Date;
  conversation_id: string;
}

export function useTodos() {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Todo[];
    },
  });

  const createTodo = useMutation({
    mutationFn: async ({ message_id, assigned_to, due_date, conversation_id }: CreateTodoInput) => {
      const { error } = await supabase
        .from('todos')
        .insert({
          message_id,
          assigned_to,
          due_date,
          conversation_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo created successfully');
    },
    onError: (error) => {
      console.error('Error creating todo:', error);
      toast.error('Failed to create todo');
    },
  });

  return {
    todos,
    isLoading,
    createTodo: createTodo.mutate,
  };
}
