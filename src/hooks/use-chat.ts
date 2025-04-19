
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectLanguage } from "@/lib/language-detection";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";

export function useChat(conversationId: string) {
  const [userId, setUserId] = useState<string | null>(null);
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
      // Save the original user's "AI:" message without trimming the prefix
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content,
          sender_id: null,
          status: 'sent',
          metadata: { isAIPrompt: true }
        });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        toast.error('Failed to send message');
        throw userMessageError;
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

      if (error || !data.success) {
        console.error('AI chat error:', error);
        toast.error('Failed to process AI message');
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error processing AI message:', error);
      toast.error('Failed to process AI message');
    }
  };

  const sendMessage = async (
    content: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ) => {
    if (!conversationId || !content.trim()) {
      console.error("Cannot send message: missing conversation ID or content");
      return;
    }

    // Check if this is an AI message
    if (content.toLowerCase().startsWith('ai:')) {
      return handleAIMessage(content);
    }
    
    if (!conversationId || !content.trim() || !userId) {
      console.error("Cannot send message: missing conversation ID, content, or user ID");
      return;
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
        throw error;
      }
      
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
        
      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleVoiceRecord = () => {
    toast.info('Voice recording coming soon');
  };

  return {
    sendMessage,
    handleVoiceRecord,
    userId
  };
}
