import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectLanguage } from "@/lib/language-detection";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";

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
      
      // Save the original user's "AI:" message
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content,
          sender_id: userId,
          status: 'sent',
          metadata: { isAIPrompt: true }
        });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        toast.error('Failed to save your message');
        return false;
      }

      // Process with AI using the trimmed content
      const trimmedContent = content.replace(/^AI:\s*/, '').trim();
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          content: trimmedContent, 
          conversationId, 
          userId 
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
