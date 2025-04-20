
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
  isProcessing?: boolean;
}

export function VoiceRecorder({ 
  onSendVoice, 
  onCancel, 
  className,
  isProcessing = false
}: VoiceRecorderProps) {
  const { isRecording, recordingDuration, startRecording, stopRecording, convertBlobToBase64 } = useVoiceRecorder();
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      const blob = await stopRecording();
      
      if (blob && blob.size > 0) {
        const base64 = await convertBlobToBase64(blob);
        await onSendVoice(base64);
      } else {
        toast.error('No audio recorded');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording');
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
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center gap-4">
        {isRecording ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="icon"
                onClick={handleStopRecording}
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
              
              {isRecording && !isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <div className="text-sm font-medium text-destructive">
                    {formatDuration(recordingDuration)}
                  </div>
                </div>
              )}
              
              {isProcessing && (
                <div className="text-sm text-muted-foreground">
                  Processing...
                </div>
              )}
            </div>
            
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
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="icon"
              onClick={handleStartRecording}
              className="rounded-full h-12 w-12 group"
              disabled={isProcessing}
            >
              <Mic className={cn(
                "h-6 w-6 transition-transform duration-300",
                "group-hover:scale-110 group-hover:text-primary-foreground"
              )} />
              <span className="sr-only">Start recording</span>
            </Button>
            <span className="text-sm text-muted-foreground animate-fade-in">
              Tap to record audio message
            </span>
          </div>
        )}
      </div>
      
      {isRecording && (
        <p className="text-xs text-muted-foreground mt-1 animate-fade-in">
          Voice messages are automatically transcribed
        </p>
      )}
    </div>
  );
}
