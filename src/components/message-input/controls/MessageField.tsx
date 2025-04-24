
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useIsMobile();

  const handleEmojiSelect = (emojiData: any) => {
    onChange(message + emojiData.emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      const resetHeight = () => {
        const textarea = textareaRef.current!;
        textarea.style.height = '40px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      };
      
      const handleFocus = () => {
        setTimeout(() => {
          resetHeight();
          if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      };
      
      resetHeight();
      textareaRef.current.addEventListener('focus', handleFocus);
      
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('focus', handleFocus);
        }
      };
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
    <div ref={containerRef} className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className={cn(
          "min-h-[40px] max-h-[120px] pr-10 py-2 rounded-full no-scrollbar resize-none",
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
