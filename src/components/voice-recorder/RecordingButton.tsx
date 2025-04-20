
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function RecordingButton({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording
}: RecordingButtonProps) {
  if (isRecording) {
    return (
      <Button
        variant="destructive"
        size="icon"
        onClick={onStopRecording}
        className={cn(
          "rounded-full h-12 w-12 animate-pulse", 
          isProcessing && "opacity-50"
        )}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <StopCircle className="h-6 w-6" />
        )}
        <span className="sr-only">Stop recording</span>
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="icon"
      onClick={onStartRecording}
      className="rounded-full h-12 w-12 group"
      disabled={isProcessing}
    >
      <Mic className={cn(
        "h-6 w-6 transition-transform duration-300",
        "group-hover:scale-110 group-hover:text-primary-foreground"
      )} />
      <span className="sr-only">Start recording</span>
    </Button>
  );
}
