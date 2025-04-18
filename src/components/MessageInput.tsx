
import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartSuggestion {
  id: string;
  text: string;
}

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStartRecording?: () => void;
  suggestions?: SmartSuggestion[];
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onStartRecording,
  suggestions = [],
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  return (
    <div className={cn("w-full", className)}>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="outline"
              size="sm"
              className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              {suggestion.text}
            </Button>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach files</span>
        </Button>
        
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="pr-10 py-6 rounded-full"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">Add emoji</span>
          </Button>
        </div>
        
        {message.trim() ? (
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            onClick={onStartRecording}
          >
            <Mic className="h-5 w-5" />
            <span className="sr-only">Record voice message</span>
          </Button>
        )}
      </form>
    </div>
  );
}
