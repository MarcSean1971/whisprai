
import { useState } from "react";
import { Mic, StopCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSendVoice: (base64Audio: string) => void;
  onCancel: () => void;
  className?: string;
}

export function VoiceRecorder({ onSendVoice, onCancel, className }: VoiceRecorderProps) {
  const { isRecording, startRecording, stopRecording, convertBlobToBase64 } = useVoiceRecorder();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleStartRecording = async () => {
    setAudioBlob(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      setAudioBlob(blob);
      const base64 = await convertBlobToBase64(blob);
      onSendVoice(base64);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    onCancel();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isRecording ? (
        <>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleStopRecording}
            className="animate-pulse"
          >
            <StopCircle className="h-5 w-5" />
            <span className="sr-only">Stop recording</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cancel recording</span>
          </Button>
        </>
      ) : (
        <Button
          variant="default"
          size="icon"
          onClick={handleStartRecording}
          className="rounded-full"
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Start recording</span>
        </Button>
      )}
    </div>
  );
}
