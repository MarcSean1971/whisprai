
import { useState, useRef } from "react";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileAttachment } from "./message-input/FileAttachment";
import { MessageSuggestions } from "./message-input/MessageSuggestions";
import { MessageControls } from "./message-input/MessageControls";

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className={className}>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {attachment && (
        <FileAttachment
          file={attachment.file}
          url={attachment.url}
          onClear={() => {
            setAttachment(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        />
      )}

      <MessageSuggestions
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        onSuggestionClick={handleSuggestionClick}
        disabled={disabled}
      />

      <MessageControls
        message={message}
        onChange={setMessage}
        onStartRecording={onStartRecording}
        onAttachmentClick={() => fileInputRef.current?.click()}
        onSubmit={handleSubmit}
        disabled={disabled}
        inputRef={inputRef}
      />
    </div>
  );
}
