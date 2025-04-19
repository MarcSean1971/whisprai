
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
      
      // First, update the message to remove the voiceMessage from metadata
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          metadata: supabase.rpc('jsonb_delete_path', {
            json: { 
              voiceMessage: null 
            },
            path: '{voiceMessage}'
          })
        })
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
