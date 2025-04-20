
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) throw new Error("User not authenticated");
      
      console.log('Adding reaction:', { messageId, emoji, userId: userData.user.id });
      
      // Check if this reaction already exists to avoid duplicates
      const { data: existingReactions } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userData.user.id)
        .eq('emoji', emoji);
        
      if (existingReactions && existingReactions.length > 0) {
        console.log('Reaction already exists:', existingReactions[0]);
        return existingReactions[0];
      }
      
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({ 
          message_id: messageId, 
          emoji,
          user_id: userData.user.id 
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Reaction added successfully:', data);
    },
    onError: (error) => {
      console.error('Error in addReaction mutation:', error);
      toast.error('Failed to add reaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    }
  });

  const removeReaction = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) throw new Error("User not authenticated");
      
      console.log('Removing reaction:', { messageId, emoji, userId: userData.user.id });
      
      const { error, data } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('emoji', emoji)
        .eq('user_id', userData.user.id)
        .select();

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Reaction removed successfully:', data);
    },
    onError: (error) => {
      console.error('Error in removeReaction mutation:', error);
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
