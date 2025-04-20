import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageReplyInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function MessageReplyInput({ onSubmit, onCancel }: MessageReplyInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(content);
        setIsSaved(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSaved) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => !isSaved && setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your reply..."
        disabled={isSaved}
        className={cn(
          "min-h-[36px] max-h-[150px] flex-1 py-2 px-3 text-sm resize-none overflow-hidden",
          "focus:ring-1 focus:ring-primary border-purple-200",
          "bg-gray-100 hover:bg-gray-50 text-gray-900",
          isSaved && "bg-gray-200 text-gray-700 cursor-not-allowed border-gray-300"
        )}
      />
      {content.trim() && !isSaved && (
        <div className="flex gap-1 shrink-0">
          <Button 
            type="submit" 
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button 
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  );
}
