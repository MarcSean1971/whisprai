import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { detectLanguage } from "@/lib/language-detection";

export function useChat(conversationId: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  const handleAIMessage = async (content: string) => {
    try {
      if (!userId) {
        console.error('No user ID available');
        toast.error('Please log in to use AI features');
        return false;
      }

      if (isProcessingAI) {
        console.log('Already processing an AI message');
        return false;
      }

      setIsProcessingAI(true);
      console.log("Processing AI message:", content);
      
      const aiPrompt = content.replace(/^AI:\s*/, '').trim();
      
      const { data: promptMessage, error: createError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: aiPrompt,
          sender_id: userId,
          status: 'sent',
          private_room: 'AI',
          metadata: { isAIPrompt: true }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating AI prompt message:', createError);
        toast.error('Failed to create AI message');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          messageId: promptMessage.id,
          conversationId: conversationId,
          userId: userId
        }
      });

      if (error) {
        console.error('AI chat error:', error);
        toast.error('Failed to process AI message');
        return false;
      }

      if (!data?.success) {
        console.error('AI processing failed:', data);
        toast.error('AI processing failed');
        return false;
      }

      toast.success('AI message processed successfully');
      return true;
    } catch (error) {
      console.error('Error processing AI message:', error);
      toast.error('Failed to process AI message');
      return false;
    } finally {
      setIsProcessingAI(false);
    }
  };

  const sendMessage = async (
    content: string,
    voiceMessageData?: { 
      base64Audio: string; 
      audioPath?: string 
    },
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    if (!conversationId || (!content.trim() && !voiceMessageData && !attachments?.length)) {
      console.error("Cannot send message: missing conversation ID or content");
      return false;
    }

    // Handle AI messages
    if (content.toLowerCase().startsWith('ai:')) {
      return handleAIMessage(content);
    }
    
    if (!userId) {
      toast.error('Please log in to send messages');
      return false;
    }
    
    try {
      const detectedLanguage = await detectLanguage(content);
      
      const messageData = {
        conversation_id: conversationId,
        content,
        original_language: detectedLanguage,
        sender_id: userId,
        status: 'sent',
        metadata: {
          ...(location ? { location } : {}),
          ...(voiceMessageData?.audioPath ? { voiceMessage: voiceMessageData.audioPath } : {}),
          ...(attachments && attachments.length > 0 ? { attachments } : {})
        }
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return false;
      }
      
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
        
      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  const handleVoiceRecord = () => {
    toast.info('Voice recording coming soon');
  };

  return {
    sendMessage,
    handleVoiceRecord,
    userId,
    isProcessingAI
  };
}
