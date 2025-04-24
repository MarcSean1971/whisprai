
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useMessageAttachments() {
  const [attachments, setAttachments] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const clearAttachment = (index?: number) => {
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

  const uploadAttachments = async () => {
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
    return uploadedAttachments as { url: string; name: string; type: string }[];
  };

  return {
    attachments,
    fileInputRef,
    cameraInputRef,
    handleFileChange,
    clearAttachment,
    uploadAttachments
  };
}
