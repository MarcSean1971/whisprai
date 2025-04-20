
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelButtonProps {
  onCancel: () => void;
  isProcessing: boolean;
}

export function CancelButton({ onCancel, isProcessing }: CancelButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onCancel}
      disabled={isProcessing}
      className="rounded-full h-10 w-10"
    >
      <X className="h-5 w-5" />
      <span className="sr-only">Cancel recording</span>
    </Button>
  );
}
