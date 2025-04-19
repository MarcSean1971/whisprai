
import { useState } from "react";
import { Mic, StopCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onSendVoice: (base64Audio: string) => void;
  onCancel: () => void;
  className?: string;
}

export function VoiceRecorder({ onSendVoice, onCancel, className }: VoiceRecorderProps) {
  const { isRecording, startRecording, stopRecording, convertBlobToBase64 } = useVoiceRecorder();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const blob = await stopRecording();
      
      if (blob) {
        console.log('Converting audio blob to base64...');
        const base64 = await convertBlobToBase64(blob);
        console.log('Sending voice message...');
        await onSendVoice(base64);
      } else {
        toast.error('No audio recorded');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
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
            className={cn("animate-pulse", isProcessing && "opacity-50")}
            disabled={isProcessing}
          >
            <StopCircle className="h-5 w-5" />
            <span className="sr-only">Stop recording</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
            disabled={isProcessing}
          >
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
