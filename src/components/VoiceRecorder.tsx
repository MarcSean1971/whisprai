
import { useState, useEffect } from "react";
import { Mic, StopCircle, X, Loader2 } from "lucide-react";
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(result.state === 'granted');
        
        result.addEventListener('change', (e) => {
          setHasPermission((e.target as PermissionStatus).state === 'granted');
        });
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        // Fallback to getUserMedia for older browsers
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasPermission(true);
        } catch (mediaError) {
          console.error('Error accessing microphone:', mediaError);
          setHasPermission(false);
          toast.error('Microphone access denied');
        }
      }
    };

    checkPermission();
  }, []);

  const handleStartRecording = async () => {
    if (!hasPermission) {
      toast.error('Please allow microphone access to record messages');
      return;
    }

    try {
      await startRecording();
      toast.success('Recording started');
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
        const base64 = await convertBlobToBase64(blob);
        await onSendVoice(base64);
        toast.success('Voice message sent');
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

  if (hasPermission === false) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="destructive"
          onClick={() => toast.error('Please enable microphone access in your browser settings')}
        >
          Microphone Access Needed
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isRecording ? (
        <>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleStopRecording}
            className={cn(
              "animate-pulse", 
              isProcessing && "opacity-50",
              "rounded-full h-10 w-10"
            )}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <StopCircle className="h-5 w-5" />
            )}
            <span className="sr-only">Stop recording</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
            disabled={isProcessing}
            className="rounded-full h-10 w-10"
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
          className="rounded-full h-10 w-10"
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Start recording</span>
        </Button>
      )}
    </div>
  );
}
