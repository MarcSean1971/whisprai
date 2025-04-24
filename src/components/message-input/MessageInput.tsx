
import { useState, useRef } from "react";
import { MessageControls } from "./controls/MessageControls";
import { MessageSuggestions } from "./MessageSuggestions";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { AttachmentList } from "./file-handling/AttachmentList";
import { FileInputs } from "./file-handling/FileInputs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enhanceMessage } from "./controls/enhance/EnhanceMessageButton";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: { url: string; name: string; type: string }[]) => void;
  onStartRecording: () => void;
  suggestions?: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onStartRecording,
  suggestions = [],
  isLoadingSuggestions = false,
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<{ file: File; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && attachments.length === 0) {
      return;
    }

    try {
      let uploadedAttachments: { url: string; name: string; type: string }[] = [];

      // Process attachments if any
      if (attachments.length > 0) {
        toast.info("Uploading attachments...");
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not authenticated");
        
        uploadedAttachments = await Promise.all(
          attachments.map(async ({ file }) => {
            const filePath = `attachments/${userData.user!.id}/${Math.random().toString(36).substring(2)}/${file.name}`;
            
            const { error: uploadError } = await supabase.storage
              .from("message-attachments")
              .upload(filePath, file);
              
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage
              .from("message-attachments")
              .getPublicUrl(filePath);
              
            return {
              url: data.publicUrl,
              name: file.name,
              type: file.type
            };
          })
        );
      }
      
      // Send the message with attachments
      onSendMessage(message.trim(), uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
      
      // Reset state
      setMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload attachments");
    }
  };

  const handleSuggestionClick = (text: string) => {
    setMessage(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const clearAttachments = (index?: number) => {
    if (index !== undefined) {
      const newAttachments = [...attachments];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      setAttachments(newAttachments);
    } else {
      attachments.forEach(attachment => URL.revokeObjectURL(attachment.url));
      setAttachments([]);
    }
  };

  return (
    <div className="space-y-2">
      <FileInputs 
        attachments={attachments} 
        setAttachments={setAttachments} 
        disabled={disabled}
      />
      
      {attachments.length > 0 && (
        <AttachmentList
          attachments={attachments}
          onClear={clearAttachments}
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
        onAttachmentClick={handleAttachmentClick}
        onCameraClick={handleCameraClick}
        onSubmit={handleSubmit}
        disabled={disabled}
        inputRef={inputRef}
        canAttach={attachments.length < 5}
      />
    </div>
  );
}
