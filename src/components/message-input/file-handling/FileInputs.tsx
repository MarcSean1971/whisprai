
import { useRef } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed'
];

interface FileInputsProps {
  attachments: { file: File; url: string }[];
  setAttachments: React.Dispatch<React.SetStateAction<{ file: File; url: string }[]>>;
  disabled: boolean;
}

export function FileInputs({ attachments, setAttachments, disabled }: FileInputsProps) {
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

  return (
    <>
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
    </>
  );
}
