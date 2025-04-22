
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMessageTodoStatus(messageId: string) {
  return useQuery({
    queryKey: ['message-todo-status', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('id')
        .eq('message_id', messageId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    }
  });
}
