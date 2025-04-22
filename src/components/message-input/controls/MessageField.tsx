
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  
  const handleEmojiSelect = (emojiData: any) => {
    onChange(message + emojiData.emoji);
  };

  // Auto-resize functionality
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Emoji picker trigger button
  const emojiTrigger = (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 rounded-full p-0"
      disabled={disabled}
    >
      <Smile className="h-4 w-4" />
      <span className="sr-only">Emoji</span>
    </Button>
  );

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className={cn(
          "min-h-[40px] max-h-[120px] pr-10 py-2 rounded-full overflow-y-auto",
          isAnalyzing && "pr-16",
          isMobile ? "text-base" : "text-sm"
        )}
        disabled={disabled}
        rows={1}
      />
      {isAnalyzing && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          triggerButton={emojiTrigger}
          open={isEmojiPickerOpen}
          onOpenChange={setIsEmojiPickerOpen}
          side="top"
          align="end"
          sideOffset={5}
        />
      </div>
    </div>
  );
}
