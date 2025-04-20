
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export function useMessageReactions(messageId: string) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`message-reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          console.log('Message reaction change:', payload);
          queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, queryClient]);

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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('message_reactions')
        .insert({ 
          message_id: messageId, 
          emoji,
          user_id: user.id 
        });

      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }
    },
    onMutate: async ({ emoji }) => {
      // Optimistic update
      const previousReactions = queryClient.getQueryData(['message-reactions', messageId]);
      
      queryClient.setQueryData(['message-reactions', messageId], (old: MessageReaction[] = []) => {
        const { data: { user } } = supabase.auth.getSession() as any;
        return [...old, {
          id: 'temp-id',
          message_id: messageId,
          user_id: user?.id,
          emoji,
          created_at: new Date().toISOString()
        }];
      });

      return { previousReactions };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      queryClient.setQueryData(['message-reactions', messageId], context?.previousReactions);
      toast.error('Failed to add reaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    }
  });

  const removeReaction = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('emoji', emoji)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }
    },
    onError: () => {
      toast.error('Failed to remove reaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    }
  });

  return {
    reactions,
    isLoading,
    addReaction: addReaction.mutate,
    removeReaction: removeReaction.mutate
  };
}
