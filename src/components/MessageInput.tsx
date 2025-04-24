
import { useState, useRef } from "react";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { FileAttachment } from "./message-input/FileAttachment";
import { MessageSuggestions } from "./message-input/MessageSuggestions";
import { MessageControls } from "./message-input/MessageControls";
import { FileInputs } from "./message-input/FileInputs";
import { useMessageAttachments } from "@/hooks/use-message-attachments";
import { useKeyboardVisibility } from "@/hooks/use-keyboard-visibility";
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const isKeyboardVisible = useKeyboardVisibility();
  const {
    attachments,
    handleFileChange,
    clearAttachment,
    uploadAttachments,
    fileInputRef,
    cameraInputRef
  } = useMessageAttachments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() || attachments.length > 0) {
      const uploadedAttachments = await uploadAttachments();
      onSendMessage(message, uploadedAttachments);
      setMessage("");
      clearAttachment();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn(
      "w-full bg-background relative", 
      "pb-[env(safe-area-inset-bottom,0px)]",
      className
    )}>
      <FileInputs
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileChange={handleFileChange}
        disabled={disabled}
        maxFiles={5}
        currentFiles={attachments.length}
      />
      
      {attachments.length > 0 && (
        <FileAttachment
          files={attachments.map(a => a.file)}
          urls={attachments.map(a => a.url)}
          onClear={clearAttachment}
        />
      )}

      <MessageSuggestions
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        onSuggestionClick={handleSuggestionClick}
        disabled={disabled}
        hideOnKeyboard={isKeyboardVisible}
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
