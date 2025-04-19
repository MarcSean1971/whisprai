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
      
      // Create a new AI message record
      const { data: aiMessage, error: createError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          prompt: content.replace(/^AI:\s*/, '').trim(),
          user_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating AI message:', createError);
        toast.error('Failed to create AI message');
        return false;
      }

      // Process with AI using the new message ID
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { aiMessageId: aiMessage.id }
      });

      if (error) {
        console.error('AI chat error:', error);
        toast.error(error.message || 'Failed to process AI message');
        return false;
      }

      if (!data?.success) {
        console.error('AI processing failed:', data);
        toast.error('AI processing failed');
        return false;
      }

      console.log('AI message processed successfully');
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
    location?: { latitude: number; longitude: number; accuracy: number }
  ) => {
    if (!conversationId || !content.trim()) {
      console.error("Cannot send message: missing conversation ID or content");
      return false;
    }

    // Check if this is an AI message
    if (content.toLowerCase().startsWith('ai:')) {
      console.log("Detected AI message, handling specially:", content);
      return handleAIMessage(content);
    }
    
    if (!userId) {
      console.error("Cannot send message: missing user ID");
      toast.error('Please log in to send messages');
      return false;
    }
    
    try {
      const detectedLanguage = await detectLanguage(content);
      console.log("Detected language:", detectedLanguage);
      
      const messageData = {
        conversation_id: conversationId,
        content,
        original_language: detectedLanguage,
        sender_id: userId,
        status: 'sent',
        viewer_id: userId,
        metadata: location ? { location } : null
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
