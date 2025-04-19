
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Paperclip, Smile } from "lucide-react";

interface MessageControlsProps {
  message: string;
  onChange: (value: string) => void;
  onStartRecording: () => void;
  onAttachmentClick: () => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function MessageControls({
  message,
  onChange,
  onStartRecording,
  onAttachmentClick,
  onSubmit,
  disabled,
  inputRef
}: MessageControlsProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-center">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onAttachmentClick}
        disabled={disabled}
      >
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach files</span>
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
