
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Todo {
  id: string;
  message_id: string;
  message_content: string | null;
  creator_id: string;
  assigned_to: string;
  due_date: string;
  conversation_id: string;
  status: 'pending' | 'completed';
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateTodoInput {
  message_id: string;
  message_content: string;
  assigned_to: string;
  due_date: Date;
  conversation_id: string;
}

interface UpdateTodoInput {
  id: string;
  assigned_to?: string;
  due_date?: Date;
  status?: 'pending' | 'completed';
  comment?: string;
}

export function useTodos() {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      // First, fetch todos
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Then for each todo, get the profile info separately to avoid relation errors
      const todosWithProfiles = await Promise.all(
        data.map(async (todo) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', todo.assigned_to)
            .single();
          
          return {
            ...todo,
            profiles: profileError ? { 
              first_name: null, 
              last_name: null 
            } : profileData
          };
        })
      );
      
      return todosWithProfiles as (Todo & { 
        profiles: { first_name: string | null; last_name: string | null } 
      })[];
    },
  });

  const createTodo = useMutation({
    mutationFn: async ({ message_id, message_content, assigned_to, due_date, conversation_id }: CreateTodoInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const formattedDate = format(due_date, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from('todos')
        .insert({
          message_id,
          message_content,
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

  const updateTodo = useMutation({
    mutationFn: async ({ id, assigned_to, due_date, status, comment }: UpdateTodoInput) => {
      const updates: any = {};
      if (assigned_to) updates.assigned_to = assigned_to;
      if (due_date) updates.due_date = format(due_date, "yyyy-MM-dd");
      if (status) updates.status = status;
      if (comment !== undefined) updates.comment = comment;

      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo updated successfully');
    },
    onError: (error) => {
      console.error('Error updating todo:', error);
      toast.error('Failed to update todo');
    },
  });

  return {
    todos,
    isLoading,
    createTodo: createTodo.mutate,
    updateTodoStatus: updateTodoStatus.mutate,
    updateTodo: updateTodo.mutate,
  };
}
