
import { useState } from "react";
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

  const handleSendMessage = async (
    content: string, 
    attachments?: { url: string; name: string; type: string }[]
  ) => {
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
  };

  const handleVoiceMessage = async (base64Audio: string) => {
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
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process voice message');
    } finally {
      setIsProcessingVoice(false);
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-[100]">
      <div className="bg-background/80 backdrop-blur-sm border-t">
        <div 
          className="px-4"
          style={{ 
            paddingTop: '0.5rem',
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
