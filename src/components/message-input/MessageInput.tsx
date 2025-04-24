
import React, { useState, useEffect, useRef } from "react";
import { MessageControls } from "./controls/MessageControls";
import { AttachmentList } from "./file-handling/AttachmentList";
import { FileInputs } from "./file-handling/FileInputs";
import { MessageSuggestions } from "./MessageSuggestions";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<boolean>;
  conversationId: string;
  onStartRecording?: () => void;
  disabled?: boolean;
  disableAttachments?: boolean;
  forceFocus?: boolean;
  setTyping?: (isTyping: boolean) => void;
  onMessageSent?: () => void;
  className?: string;
  messageInputRef?: React.RefObject<HTMLInputElement>;
  suggestions?: any[];
  isLoadingSuggestions?: boolean;
}

export function MessageInput({
  onSendMessage,
  conversationId,
  onStartRecording,
  disabled = false,
  disableAttachments = false,
  forceFocus = false,
  setTyping,
  onMessageSent,
  className,
  messageInputRef: externalInputRef,
  suggestions = [],
  isLoadingSuggestions = false
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  // Effect to handle forced focus
  useEffect(() => {
    if (forceFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [forceFocus, inputRef]);

  // Clear message when conversation changes
  useEffect(() => {
    setMessage("");
    setAttachments([]);
  }, [conversationId]);

  // Handle typing indicators
  useEffect(() => {
    if (!setTyping) return;

    if (message.trim()) {
      setTyping(true);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        setTyping(false);
      }, 3000);
      
      setTypingTimeout(timeout);
    } else {
      setTyping(false);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    }
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [message, setTyping, typingTimeout]);

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) {
      return;
    }
    
    const trimmedMessage = message.trim();
    console.log('[MessageInput] Sending message:', trimmedMessage, 'with attachments:', attachments.length);
    
    const success = await onSendMessage(trimmedMessage, attachments.length > 0 ? attachments : undefined);
    
    if (success) {
      setMessage("");
      setAttachments([]);
      if (onMessageSent) {
        console.log('[MessageInput] Message sent successfully, calling onMessageSent');
        onMessageSent();
      }
    }
  };

  return (
    <div className={`flex flex-col w-full ${className || ""}`}>
      <FileInputs
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileChange={handleAttachmentChange}
      />
      
      {attachments.length > 0 && (
        <div className="px-4 py-2">
          <AttachmentList
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />
        </div>
      )}

      <div className={isInputFocused ? "pb-2" : ""}>
        <MessageSuggestions
          isVisible={isInputFocused && !message.trim()}
          onSelect={(suggestion) => {
            setMessage(suggestion);
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
          conversationId={conversationId}
          suggestions={suggestions}
          isLoading={isLoadingSuggestions}
        />
      </div>
      
      <div className="px-2 sm:px-4 py-2 border-t flex items-end">
        <MessageControls
          message={message}
          onChange={handleMessageChange}
          onStartRecording={onStartRecording || (() => {})}
          onAttachmentClick={handleAttachmentClick}
          onCameraClick={handleCameraClick}
          onSubmit={handleSubmit}
          disabled={disabled}
          inputRef={inputRef}
          canAttach={!disableAttachments}
        />
      </div>
    </div>
  );
}

export default MessageInput;
