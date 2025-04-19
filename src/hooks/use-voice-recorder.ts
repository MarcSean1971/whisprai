
import { useState, useRef } from 'react';
import { toast } from 'sonner';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        console.log('Received audio data chunk:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(error instanceof Error ? error.message : 'Could not access microphone');
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || !isRecording) {
        console.log('No active recording to stop');
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        console.log('Recording stopped, creating audio blob');
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        audioChunks.current = [];
        resolve(audioBlob);
      };
      
      try {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        console.log('Stopped recording and released microphone');
      } catch (error) {
        console.error('Error stopping recording:', error);
        resolve(null);
      }
    });
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        console.log('Converted audio blob to base64');
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    convertBlobToBase64
  };
}
