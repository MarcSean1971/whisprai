
import { forwardRef } from "react";
import { ALLOWED_FILE_TYPES } from "@/lib/constants";

interface FileInputsProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  maxFiles: number;
  currentFiles: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
}

export function FileInputs({ 
  onFileChange, 
  disabled, 
  maxFiles, 
  currentFiles,
  fileInputRef,
  cameraInputRef
}: FileInputsProps) {
  return (
    <>
      <input 
        type="file" 
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        ref={fileInputRef}
        className="hidden" 
        onChange={onFileChange}
        disabled={disabled || currentFiles >= maxFiles}
      />
      
      <input 
        type="file" 
        accept="image/*,video/*"
        capture="environment"
        ref={cameraInputRef}
        className="hidden" 
        onChange={onFileChange}
        disabled={disabled || currentFiles >= maxFiles}
      />
    </>
  );
}

FileInputs.displayName = "FileInputs";
