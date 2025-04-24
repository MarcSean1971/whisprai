
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardVisibility } from "@/hooks/use-keyboard-visibility";

interface MessageFieldProps {
  message: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isAnalyzing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  className?: string;
}

export function MessageField({
  message,
  onChange,
  disabled,
  isAnalyzing,
  inputRef,
  className
}: MessageFieldProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const isKeyboardVisible = useKeyboardVisibility();
  
  const handleEmojiSelect = (emojiData: any) => {
    onChange(message + emojiData.emoji);
  };

  // Reset textarea height when message is empty
  useEffect(() => {
    if (!textareaRef.current) return;

    if (!message) {
      textareaRef.current.style.height = '40px'; // Reset to single line height
    } else {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Cap at max height
    }
  }, [message]);

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
    <div className={cn(
      "relative",
      isKeyboardVisible ? "flex-1" : "flex-1",
      className
    )}>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className={cn(
          "min-h-[40px] max-h-[120px] pr-10 py-2 rounded-full no-scrollbar",
          "resize-none focus-visible:ring-1 transition-[height]",
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
      
      {!isKeyboardVisible && (
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
      )}
    </div>
  );
}
