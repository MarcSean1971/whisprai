
import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Paperclip, Smile, Sparkles, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (message: string, attachment?: { url: string; name: string; type: string }) => void;
  onStartRecording: () => void;
  suggestions?: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
  className?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onStartRecording,
  suggestions = [],
  isLoadingSuggestions = false,
  className,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{ file: File; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    let attachmentData;
    if (attachment) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(`${Date.now()}_${attachment.file.name}`, attachment.file);
        
        if (uploadError) {
          toast.error('Failed to upload attachment');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(uploadData.path);
        
        attachmentData = { 
          url: publicUrl, 
          name: attachment.file.name, 
          type: attachment.file.type 
        };
      } catch (error) {
        toast.error('Error processing attachment');
        return;
      }
    }

    if (message.trim() || attachmentData) {
      onSendMessage(message, attachmentData);
      setMessage("");
      setAttachment(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachment({ file, url });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {attachment && (
        <div className="mb-2 flex items-center justify-between p-2 bg-primary/10 rounded-md">
          <div className="flex items-center">
            <File className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm truncate max-w-[200px]">{attachment.file.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive/80"
            onClick={clearAttachment}
          >
            <File className="h-4 w-4" />
          </Button>
        </div>
      )}

      {(suggestions.length > 0 || isLoadingSuggestions) && (
        <div className="mb-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1">
            {isLoadingSuggestions ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap flex-shrink-0"
                disabled
              >
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Generating suggestions...
              </Button>
            ) : (
              <div className="flex gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors group whitespace-nowrap flex-shrink-0"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    disabled={disabled}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-primary/70 group-hover:text-primary/90" />
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
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
    </div>
  );
}
