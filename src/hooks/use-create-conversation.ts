
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseCreateConversationOptions {
  onSuccess?: () => void;
}

export function useCreateConversation({ onSuccess }: UseCreateConversationOptions = {}) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const createConversation = async (contactId: string) => {
    console.log("Starting conversation creation with contact ID:", contactId);
    
    if (isCreating) {
      console.log("Creation already in progress");
      return null;
    }
    
    try {
      setIsCreating(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Authentication error:", userError);
        toast.error('Not authenticated');
        return null;
      }

      // Check if conversation already exists
      console.log("Checking if conversation already exists");
      const { data: existingConversation, error: existingError } = await supabase.rpc(
        'get_existing_conversation',
        { user1_id: user.id, user2_id: contactId }
      );

      if (existingError) {
        console.error("Error checking existing conversation:", existingError);
      }

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation);
        toast.info("Opening existing conversation");
        navigate(`/chat/${existingConversation}`);
        return existingConversation;
      }

      console.log("No existing conversation found, creating new one");
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Failed to create conversation:", conversationError);
        toast.error(conversationError.message || 'Failed to create conversation');
        return null;
      }

      console.log("Conversation created successfully:", conversation);

      // Add participants to conversation
      console.log("Adding participants to conversation");
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: user.id
          },
          {
            conversation_id: conversation.id,
            user_id: contactId
          }
        ]);

      if (participantsError) {
        console.error("Failed to add participants:", participantsError);
        
        // Clean up the conversation
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
          
        if (deleteError) {
          console.error("Error cleaning up conversation:", deleteError);
        }
        
        toast.error(participantsError.message || 'Failed to add participants');
        return null;
      }

      console.log("Conversation creation complete, ID:", conversation.id);
      toast.success("Conversation started");
      
      if (onSuccess) {
        onSuccess();
      }
      
      navigate(`/chat/${conversation.id}`);
      return conversation.id;
      
    } catch (error) {
      console.error('Unexpected error in conversation creation:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    createConversation
  };
}
