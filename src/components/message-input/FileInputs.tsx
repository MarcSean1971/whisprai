
import { forwardRef } from "react";
import { ALLOWED_FILE_TYPES } from "@/lib/constants";

interface FileInputsProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  maxFiles: number;
  currentFiles: number;
}

export const FileInputs = forwardRef<
  { fileInput: HTMLInputElement | null; cameraInput: HTMLInputElement | null },
  FileInputsProps
>(({ onFileChange, disabled, maxFiles, currentFiles }, ref) => {
  return (
    <>
      <input 
        type="file" 
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        ref={(el) => {
          if (typeof ref === 'object' && ref !== null) {
            (ref as any).fileInput = el;
          }
        }}
        className="hidden" 
        onChange={onFileChange}
        disabled={disabled || currentFiles >= maxFiles}
      />
      
      <input 
        type="file" 
        accept="image/*,video/*"
        capture="environment"
        ref={(el) => {
          if (typeof ref === 'object' && ref !== null) {
            (ref as any).cameraInput = el;
          }
        }}
        className="hidden" 
        onChange={onFileChange}
        disabled={disabled || currentFiles >= maxFiles}
      />
    </>
  );
});

FileInputs.displayName = "FileInputs";
