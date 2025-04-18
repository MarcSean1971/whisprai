
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStartRecording: () => void;
  suggestions: Array<{ id: string; text: string }>;
}

export function ChatInput({ onSendMessage, onStartRecording, suggestions }: ChatInputProps) {
  return (
    <div className={cn(
      "p-4 border-t transition-all",
      suggestions.length > 0 && "pb-6"
    )}>
      <MessageInput
        onSendMessage={onSendMessage}
        onStartRecording={onStartRecording}
        suggestions={suggestions}
      />
    </div>
  );
}
