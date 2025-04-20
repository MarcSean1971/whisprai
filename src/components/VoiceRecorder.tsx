
import { useState, useEffect } from "react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RecordingButton } from "./voice-recorder/RecordingButton";
import { RecordingStatus } from "./voice-recorder/RecordingStatus";
import { CancelButton } from "./voice-recorder/CancelButton";
import { PermissionError } from "./voice-recorder/PermissionError";

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
    return <PermissionError className={className} />;
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center gap-4">
        {isRecording ? (
          <>
            <div className="flex items-center gap-2">
              <RecordingButton 
                isRecording={isRecording}
                isProcessing={isProcessing}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
              
              <RecordingStatus 
                isRecording={isRecording}
                isProcessing={isProcessing}
                recordingDuration={recordingDuration}
              />
            </div>
            
            <CancelButton onCancel={handleCancel} isProcessing={isProcessing} />
          </>
        ) : (
          <div className="flex items-center gap-4">
            <RecordingButton 
              isRecording={isRecording}
              isProcessing={isProcessing}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
            
            <RecordingStatus 
              isRecording={isRecording}
              isProcessing={isProcessing}
              recordingDuration={recordingDuration}
            />
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
