
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Todo {
  id: string;
  message_id: string;
  message_content: string | null;
  messages: {
    content: string;
  } | null;
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
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .order('due_date', { ascending: true });

      if (todosError) {
        console.error('Error fetching todos:', todosError);
        throw todosError;
      }

      // Get all unique conversation IDs from todos
      const conversationIds = [...new Set(todosData.map(todo => todo.conversation_id))];

      // Fetch participants for all conversations
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles:user_id(
            id,
            first_name,
            last_name
          )
        `)
        .in('conversation_id', conversationIds);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }

      const userIds = [...new Set(todosData.map(todo => todo.assigned_to))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const messageIds = [...new Set(todosData.filter(todo => todo.message_id).map(todo => todo.message_id))];
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, content')
        .in('id', messageIds);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      }

      // Create maps for easier lookup
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, { id: string; first_name: string | null; last_name: string | null }>);

      const messagesMap = (messagesData || []).reduce((acc, message) => {
        acc[message.id] = message;
        return acc;
      }, {} as Record<string, { id: string; content: string }>);

      // Group participants by conversation
      const participantsByConversation = (participantsData || []).reduce((acc, participant) => {
        if (!acc[participant.conversation_id]) {
          acc[participant.conversation_id] = [];
        }
        
        // Safe access to profiles data with type checking
        if (participant.profiles && typeof participant.profiles === 'object') {
          const profile = participant.profiles as { 
            id: string; 
            first_name: string | null; 
            last_name: string | null 
          };
          
          acc[participant.conversation_id].push({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name
          });
        }
        
        return acc;
      }, {} as Record<string, Array<{ id: string; first_name: string | null; last_name: string | null }>>);

      const enrichedTodos = todosData.map(todo => {
        const profileData = profilesMap[todo.assigned_to] || { first_name: null, last_name: null };
        const messageData = todo.message_id ? messagesMap[todo.message_id] : null;
        const conversationParticipants = participantsByConversation[todo.conversation_id] || [];

        return {
          ...todo,
          messages: messageData ? { content: messageData.content } : null,
          profiles: {
            first_name: profileData.first_name,
            last_name: profileData.last_name
          },
          conversation_participants: conversationParticipants
        };
      });

      console.log('Fetched todos with participants:', enrichedTodos);
      
      return enrichedTodos as (Todo & { 
        profiles: { first_name: string | null; last_name: string | null },
        conversation_participants: Array<{ id: string; first_name: string | null; last_name: string | null }>
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

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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
    createTodo: createTodo.mutate,
    updateTodoStatus: updateTodoStatus.mutate,
    updateTodo: updateTodo.mutate,
    deleteTodo: deleteTodo.mutate,
  };
}
