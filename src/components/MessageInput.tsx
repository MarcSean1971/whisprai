
import { useState, useRef } from "react";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileAttachment } from "./message-input/FileAttachment";
import { MessageSuggestions } from "./message-input/MessageSuggestions";
import { MessageControls } from "./message-input/MessageControls";

interface MessageInputProps {
  onSendMessage: (
    message: string, 
    attachments?: { url: string; name: string; type: string }[]
  ) => void;
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
  const [attachments, setAttachments] = useState<{ file: File; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploadPromises = attachments.map(async (attachment) => {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(`${Date.now()}_${attachment.file.name}`, attachment.file);
        
        if (uploadError) {
          toast.error(`Failed to upload ${attachment.file.name}`);
          return null;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(uploadData.path);
        
        return { 
          url: publicUrl, 
          name: attachment.file.name, 
          type: attachment.file.type 
        };
      } catch (error) {
        toast.error(`Error processing ${attachment.file.name}`);
        return null;
      }
    });

    const uploadedAttachments = (await Promise.all(uploadPromises)).filter(Boolean);
    
    if (message.trim() || uploadedAttachments.length > 0) {
      onSendMessage(message, uploadedAttachments as { url: string; name: string; type: string }[]);
      setMessage("");
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    
    const combinedFiles = [
      ...attachments, 
      ...newFiles.map((file, index) => ({ file, url: newUrls[index] }))
    ];
    
    // Limit to 5 files
    const limitedFiles = combinedFiles.slice(0, 5);
    setAttachments(limitedFiles);
  };

  const handleClearAttachment = (index?: number) => {
    if (index !== undefined) {
      // Remove specific file
      const newAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(newAttachments);
    } else {
      // Clear all files
      setAttachments([]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
        multiple
        accept="image/*,video/*"
        ref={fileInputRef}
        className="hidden" 
        onChange={handleFileChange}
        disabled={disabled || attachments.length >= 5}
      />
      
      <input 
        type="file" 
        accept="image/*,video/*"
        capture="environment"
        ref={cameraInputRef}
        className="hidden" 
        onChange={handleFileChange}
        disabled={disabled || attachments.length >= 5}
      />
      
      {attachments.length > 0 && (
        <FileAttachment
          files={attachments.map(a => a.file)}
          urls={attachments.map(a => a.url)}
          onClear={handleClearAttachment}
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
        onCameraClick={() => cameraInputRef.current?.click()}
        onSubmit={handleSubmit}
        disabled={disabled}
        inputRef={inputRef}
        canAttach={attachments.length < 5}
      />
    </div>
  );
}
