
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Paperclip, Smile, Camera } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useState } from "react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageControlsProps {
  message: string;
  onChange: (value: string) => void;
  onStartRecording: () => void;
  onAttachmentClick: () => void;
  onCameraClick: () => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  canAttach?: boolean;
}

export function MessageControls({
  message,
  onChange,
  onStartRecording,
  onAttachmentClick,
  onCameraClick,
  onSubmit,
  disabled,
  inputRef,
  canAttach = true
}: MessageControlsProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    onChange(message + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-center relative">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onAttachmentClick}
        disabled={disabled || !canAttach}
        title="Attach files (images, documents, etc.)"
      >
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach files</span>
      </Button>
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onCameraClick}
        disabled={disabled || !canAttach}
        title="Take a photo"
      >
        <Camera className="h-5 w-5" />
        <span className="sr-only">Use camera</span>
      </Button>
      
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message..."
          className="pr-10 py-6 rounded-full"
          disabled={disabled}
        />
        
        <Popover 
          open={isEmojiPickerOpen}
          onOpenChange={setIsEmojiPickerOpen}
          modal={true}
        >
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
            className="w-full p-0" 
            align="end"
            side="top"
            sideOffset={5}
          >
            <EmojiPicker
              width={300}
              height={350}
              onEmojiClick={handleEmojiSelect}
              lazyLoadEmojis={true}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {message.trim() ? (
        <Button type="submit" size="icon" className="rounded-full" disabled={disabled}>
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          onClick={onStartRecording}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Record voice message</span>
        </Button>
      )}
    </form>
  );
}
