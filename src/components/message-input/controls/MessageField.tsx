
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smile, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

  const handleEmojiSelect = (emojiData: any) => {
    onChange(message + emojiData.emoji);
    setIsEmojiPickerOpen(false);
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
      
      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">Add emoji</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-4 z-[100]" 
          align="end"
          side="top"
          sideOffset={5}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Choose an emoji</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEmojiPickerOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <EmojiPicker
            width={300}
            height={350}
            onEmojiClick={handleEmojiSelect}
            lazyLoadEmojis={true}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
