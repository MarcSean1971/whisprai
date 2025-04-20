
import { cn } from "@/lib/utils";

interface RecordingStatusProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
}

export function RecordingStatus({
  isRecording,
  isProcessing,
  recordingDuration
}: RecordingStatusProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="text-sm text-muted-foreground">
        Processing...
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <div className="text-sm font-medium text-destructive">
          {formatDuration(recordingDuration)}
        </div>
      </div>
    );
  }

  return (
    <span className="text-sm text-muted-foreground animate-fade-in">
      Tap to record audio message
    </span>
  );
}
