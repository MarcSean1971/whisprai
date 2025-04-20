
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export function useMessageReactions(messageId: string) {
  const queryClient = useQueryClient();

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        console.error('Error fetching reactions:', error);
        throw error;
      }

      return data as MessageReaction[];
    }
  });

  const addReaction = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, emoji });

      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
    onError: () => {
      toast.error('Failed to add reaction');
    }
  });

  const removeReaction = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
    onError: () => {
      toast.error('Failed to remove reaction');
    }
  });

  return {
    reactions,
    isLoading,
    addReaction: addReaction.mutate,
    removeReaction: removeReaction.mutate
  };
}
