
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Todo {
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
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Format the date as an ISO string (YYYY-MM-DD)
      const formattedDate = format(due_date, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from('todos')
        .insert({
          message_id,
          creator_id: user.id,
          assigned_to,
          due_date: formattedDate,
          conversation_id,
          status: 'pending'
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

  const updateTodoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'completed' }) => {
      const { error } = await supabase
        .from('todos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo status updated');
    },
    onError: (error) => {
      console.error('Error updating todo status:', error);
      toast.error('Failed to update todo status');
    },
  });

  return {
    todos,
    isLoading,
    createTodo: createTodo.mutate,
    updateTodoStatus: updateTodoStatus.mutate,
  };
}
