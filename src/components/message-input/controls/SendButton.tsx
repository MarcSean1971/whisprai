
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SendButtonProps {
  hasMessage: boolean;
  buttonStyle: string;
  onStartRecording: () => void;
  disabled: boolean;
}

export function SendButton({
  hasMessage,
  buttonStyle,
  onStartRecording,
  disabled
}: SendButtonProps) {
  return (
    <Button 
      type={hasMessage ? "submit" : "button"}
      size="icon" 
      className={`rounded-full ${buttonStyle}`}
      onClick={!hasMessage ? onStartRecording : undefined}
      disabled={disabled}
    >
      {hasMessage ? (
        <Send className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
      <span className="sr-only">
        {hasMessage ? "Send message" : "Record voice message"}
      </span>
    </Button>
  );
}

