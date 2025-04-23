import { useState, useRef } from "react";
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (
    content: string, 
    voiceMessageData?: { base64Audio: string; audioPath?: string }, 
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => void;
  suggestions: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
}

export function ChatInput({
  conversationId,
  onSendMessage,
  suggestions = [],
  isLoadingSuggestions = false,
}: ChatInputProps) {
  const { requestLocation } = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<{ file: File; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (
    content: string, 
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    const locationKeywords = ['where', 'location', 'nearby', 'close', 'around', 'here'];
    const mightNeedLocation = locationKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (mightNeedLocation) {
      const location = await requestLocation();
      onSendMessage(content, undefined, location || undefined, attachments);
    } else {
      onSendMessage(content, undefined, undefined, attachments);
    }
  };

  const handleVoiceMessage = async (base64Audio: string) => {
    try {
      setIsProcessingVoice(true);
      toast.info('Processing voice message...');
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio, 
          conversationId, 
          userId 
        }
      });

      if (error) {
        console.error('Voice-to-text function error:', error);
        throw error;
      }

      if (!data?.text) {
        throw new Error('No transcription received');
      }

      if (!data?.audioPath) {
        throw new Error('No audio path received');
      }

      onSendMessage(data.text, { 
        base64Audio, 
        audioPath: data.audioPath 
      });
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process voice message');
    } finally {
      setIsProcessingVoice(false);
      setIsRecording(false);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed'
  ];

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`File type ${file.type} is not supported.`);
      return false;
    }
    
    return true;
  };

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
    const validFiles = newFiles.filter(validateFile);
    
    if (validFiles.length === 0) return;
    
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    
    const combinedFiles = [
      ...attachments, 
      ...validFiles.map((file, index) => ({ file, url: newUrls[index] }))
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
    <div 
      className="w-full bg-background"
      style={{
        height: 'fit-content'
      }}
    >
      <input 
        type="file" 
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
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
      
      {/* {attachments.length > 0 && (
        <FileAttachment
          files={attachments.map(a => a.file)}
          urls={attachments.map(a => a.url)}
          onClear={handleClearAttachment}
        />
      )} */}
      
      {/* <MessageSuggestions
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        onSuggestionClick={handleSuggestionClick}
        disabled={disabled}
      /> */}

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
