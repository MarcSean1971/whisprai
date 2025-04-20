
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Reply, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageReplyInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function MessageReplyInput({ onSubmit, onCancel }: MessageReplyInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize logic
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your reply..."
        className={cn(
          "min-h-[36px] max-h-[150px] flex-1 py-2 px-3 text-sm resize-none overflow-hidden",
          "focus:ring-1 focus:ring-primary"
        )}
      />
      <div className="flex gap-1 shrink-0">
        <Button 
          type="submit" 
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={!content.trim()}
        >
          <Reply className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

