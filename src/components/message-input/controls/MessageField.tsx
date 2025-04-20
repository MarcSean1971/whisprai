
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

interface MessageFieldProps {
  message: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isAnalyzing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function MessageField({
  message,
  onChange,
  disabled,
  isAnalyzing,
  inputRef
}: MessageFieldProps) {
  const handleEmojiSelect = (emojiData: any) => {
    onChange(message + emojiData.emoji);
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className={cn(
          "pr-10 py-6 rounded-full",
          isAnalyzing && "pr-16"
        )}
        disabled={disabled}
      />
      {isAnalyzing && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          side="top"
          align="end"
          sideOffset={5}
        />
      </div>
    </div>
  );
}
