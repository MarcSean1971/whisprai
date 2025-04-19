
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseVoiceMessageDeletionProps {
  voiceMessagePath?: string;
  messageId: string;
  conversationId: string;
  onSuccess?: () => void;
}

export function useVoiceMessageDeletion({
  voiceMessagePath,
  messageId,
  conversationId,
  onSuccess
}: UseVoiceMessageDeletionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  const handleDelete = async () => {
    if (isDeleting || !messageId) return;
    
    try {
      setIsDeleting(true);
      console.log('Attempting to delete message:', messageId, 'from conversation:', conversationId);
      
      // First, get the current message metadata
      const { data: currentMessage, error: fetchError } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching message metadata:', fetchError);
        throw new Error('Failed to fetch message');
      }
      
      // Create updated metadata object without the voiceMessage property
      const updatedMetadata = { ...currentMessage.metadata };
      if (updatedMetadata && 'voiceMessage' in updatedMetadata) {
        delete updatedMetadata.voiceMessage;
      }
      
      // Update the message metadata
      const { error: updateError } = await supabase
        .from('messages')
        .update({ metadata: updatedMetadata })
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .or(`sender_id.is.null,and(private_room.eq.AI,sender_id.eq.${currentUserId})`);

      if (updateError) {
        console.error('Error updating message metadata:', updateError);
        throw new Error('Failed to update message');
      }

      // Then delete the voice file if it exists
      if (voiceMessagePath) {
        const voicePath = voiceMessagePath.replace(/^voice_messages\/*/, '');
        console.log('Normalized voice message path for deletion:', voicePath);
        
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const { error: storageError } = await supabase.storage
              .from('voice_messages')
              .remove([voicePath]);
              
            if (!storageError) {
              console.log('Voice message file deleted successfully');
              break;
            }
            
            console.error(`Retry ${retryCount + 1}/${maxRetries} failed:`, storageError);
            retryCount++;
            
            if (retryCount === maxRetries) {
              throw new Error('Failed to delete voice message file after multiple attempts');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            if (retryCount === maxRetries - 1) throw error;
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
          }
        }
      }
      
      toast.success('Message deleted');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error in delete handler:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDelete
  };
}
