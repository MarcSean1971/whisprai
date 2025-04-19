
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
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { content, conversationId, userId }
      });

      if (error) {
        console.error('AI chat error:', error);
        toast.error('Failed to process AI message');
        throw error;
      }

      // Add a new message for the AI response with the viewer_id
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: data.message,
          sender_id: null, // AI messages have null sender_id
          viewer_id: userId, // Set viewer_id to track who triggered the AI
          status: 'sent'
        });

      return data.message;
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
        viewer_id: userId, // Add viewer_id to identify who triggered AI responses
        metadata: location ? { location } : null
      };
      
      const { error, data } = await supabase
        .from('messages')
        .insert(messageData)
        .select();

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
