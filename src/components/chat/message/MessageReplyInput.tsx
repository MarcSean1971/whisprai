
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

interface MessageReplyInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function MessageReplyInput({ onSubmit, onCancel }: MessageReplyInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-6 space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your reply..."
        className="min-h-[60px] w-[calc(100%-2rem)]"
      />
      <div className="flex gap-2">
        <Button 
          type="submit" 
          size="sm"
          className="bg-primary hover:bg-primary/90"
          disabled={!content.trim()}
        >
          <Send className="h-4 w-4 mr-1" />
          Reply
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
