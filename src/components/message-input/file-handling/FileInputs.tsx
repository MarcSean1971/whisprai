
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
  fileInputRef?: React.RefObject<HTMLInputElement>;
  cameraInputRef?: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileInputs({ fileInputRef, cameraInputRef, onFileChange }: FileInputsProps) {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const internalCameraInputRef = useRef<HTMLInputElement>(null);
  
  // Use passed refs or internal refs
  const fileRef = fileInputRef || internalFileInputRef;
  const cameraRef = cameraInputRef || internalCameraInputRef;

  return (
    <>
      <input 
        type="file" 
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        ref={fileRef}
        className="hidden" 
        onChange={onFileChange}
      />
      
      <input 
        type="file" 
        accept="image/*,video/*"
        capture="environment"
        ref={cameraRef}
        className="hidden" 
        onChange={onFileChange}
      />
    </>
  );
}
