
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface MessageReplyInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MessageReplyInput({ onSubmit, onCancel, isSubmitting = false }: MessageReplyInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-4 space-y-2">
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
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            'Reply'
          )}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
