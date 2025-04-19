
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import { PredictiveAnswer } from "@/types/predictive-answer";

interface ChatInputProps {
  onSendMessage: (content: string, location?: { latitude: number; longitude: number; accuracy: number }) => void;
  onStartRecording: () => void;
  suggestions: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onStartRecording, 
  suggestions = [],
  isLoadingSuggestions = false 
}: ChatInputProps) {
  const { requestLocation } = useLocation();

  const handleSendMessage = async (content: string) => {
    // Check if the message might need location (simple keyword check)
    const locationKeywords = ['where', 'location', 'nearby', 'close', 'around', 'here'];
    const mightNeedLocation = locationKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (mightNeedLocation) {
      const location = await requestLocation();
      onSendMessage(content, location || undefined);
    } else {
      onSendMessage(content);
    }
  };

  return (
    <div className={cn(
      "p-4 border-t transition-all",
      suggestions.length > 0 && "pb-6"
    )}>
      <MessageInput
        onSendMessage={handleSendMessage}
        onStartRecording={onStartRecording}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
      />
    </div>
  );
}
