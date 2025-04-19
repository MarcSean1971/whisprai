
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone access granted');
      stream.current = mediaStream;
      
      // Try different MIME types based on browser support
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported audio MIME type found');
      }
      
      mediaRecorder.current = new MediaRecorder(mediaStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
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
      console.log('Started recording with MIME type:', selectedMimeType);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(error instanceof Error ? error.message : 'Could not access microphone');
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || !isRecording) {
        console.log('No active recording to stop');
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        console.log('Recording stopped, creating audio blob');
        const audioBlob = new Blob(audioChunks.current, { 
          type: mediaRecorder.current?.mimeType || 'audio/webm' 
        });
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        
        // Clean up
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
          stream.current = null;
        }
        
        audioChunks.current = [];
        resolve(audioBlob);
      };
      
      try {
        mediaRecorder.current.stop();
        setIsRecording(false);
        console.log('Stopped recording and released microphone');
      } catch (error) {
        console.error('Error stopping recording:', error);
        resolve(null);
      }
    });
  }, [isRecording]);

  const convertBlobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        console.log('Converted audio blob to base64');
        resolve(base64Data);
      };
      reader.onerror = (error) => {
        console.error('Error converting blob to base64:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    convertBlobToBase64
  };
}
