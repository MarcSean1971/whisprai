
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CreateTodoInput, UpdateTodoInput } from "./types";

export async function createTodo(input: CreateTodoInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const formattedDate = format(input.due_date, "yyyy-MM-dd");
  
  const { error } = await supabase
    .from('todos')
    .insert({
      message_id: input.message_id,
      message_content: input.message_content,
      creator_id: user.id,
      assigned_to: input.assigned_to,
      due_date: formattedDate,
      conversation_id: input.conversation_id,
      status: 'pending'
    });

  if (error) throw error;
}

export async function updateTodoStatus(id: string, status: 'pending' | 'completed') {
  const { error } = await supabase
    .from('todos')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateTodo({ id, assigned_to, due_date, status, comment }: UpdateTodoInput) {
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
}

export async function deleteTodo(id: string) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
