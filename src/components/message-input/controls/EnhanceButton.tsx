
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhanceButtonProps {
  onEnhance: () => void;
  isEnhancing: boolean;
  disabled: boolean;
  hasContent: boolean;
}

export function EnhanceButton({
  onEnhance,
  isEnhancing,
  disabled,
  hasContent
}: EnhanceButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-50"
      onClick={onEnhance}
      disabled={disabled || isEnhancing || !hasContent}
      title="Enhance message with AI"
    >
      <Sparkles className={`h-5 w-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
      <span className="sr-only">Enhance message</span>
    </Button>
  );
}
