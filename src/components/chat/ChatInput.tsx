
import { useState, useEffect } from "react";
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (
    content: string, 
    voiceMessageData?: { base64Audio: string; audioPath?: string }, 
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => void;
  suggestions: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
}

export function ChatInput({ 
  conversationId,
  onSendMessage, 
  suggestions = [],
  isLoadingSuggestions = false 
}: ChatInputProps) {
  const { requestLocation } = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isKeyboard = window.visualViewport 
        ? window.visualViewport.height < window.innerHeight
        : false;
      setKeyboardVisible(isKeyboard);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (
    content: string, 
    files?: File[]
  ): Promise<boolean> => {
    try {
      // Convert File[] to the expected attachment format
      const attachments = files?.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      }));
      
      const locationKeywords = ['where', 'location', 'nearby', 'close', 'around', 'here'];
      const mightNeedLocation = locationKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
  
      if (mightNeedLocation) {
        const location = await requestLocation();
        onSendMessage(content, undefined, location || undefined, attachments);
      } else {
        onSendMessage(content, undefined, undefined, attachments);
      }
      
      // Clean up object URLs
      attachments?.forEach(attachment => URL.revokeObjectURL(attachment.url));
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  const handleVoiceMessage = async (base64Audio: string): Promise<boolean> => {
    try {
      setIsProcessingVoice(true);
      toast.info('Processing voice message...');
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio, 
          conversationId, 
          userId 
        }
      });

      if (error) {
        console.error('Voice-to-text function error:', error);
        throw error;
      }

      if (!data?.text) {
        throw new Error('No transcription received');
      }

      if (!data?.audioPath) {
        throw new Error('No audio path received');
      }

      onSendMessage(data.text, { 
        base64Audio, 
        audioPath: data.audioPath 
      });
      
      return true;
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process voice message');
      return false;
    } finally {
      setIsProcessingVoice(false);
      setIsRecording(false);
    }
  };

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 bottom-0 w-full z-[100] transition-transform duration-200",
        keyboardVisible && "transform -translate-y-3"
      )}
      style={{
        paddingBottom: 'env(keyboard-inset-height, 0px)',
        minHeight: 'env(keyboard-inset-height, 0px)'
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t">
        <div 
          className="px-4 py-2"
          style={{ 
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {isRecording ? (
            <VoiceRecorder
              onSendVoice={handleVoiceMessage}
              onCancel={() => setIsRecording(false)}
              className="flex justify-center"
              isProcessing={isProcessingVoice}
            />
          ) : (
            <MessageInput
              onSendMessage={handleSendMessage}
              onStartRecording={() => setIsRecording(true)}
              suggestions={suggestions}
              isLoadingSuggestions={isLoadingSuggestions}
              disabled={isProcessingVoice}
              conversationId={conversationId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
