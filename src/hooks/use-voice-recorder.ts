
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const durationInterval = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      console.log('Microphone access granted');
      stream.current = mediaStream;

      // Explicitly set MIME type for better cross-browser compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      console.log('Using MIME type:', mimeType);
      
      mediaRecorder.current = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      audioChunks.current = [];
      setRecordingDuration(0);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received audio chunk:', event.data.size, 'bytes');
          audioChunks.current.push(event.data);
        } else {
          console.warn('Received empty audio chunk');
        }
      };

      // Clear any existing interval
      if (durationInterval.current) {
        window.clearInterval(durationInterval.current);
      }
      
      durationInterval.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.current.start(100); // Collect data more frequently
      setIsRecording(true);
      
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

      if (durationInterval.current) {
        window.clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      mediaRecorder.current.onstop = () => {
        console.log('Recording stopped, creating audio blob from', audioChunks.current.length, 'chunks');
        
        if (audioChunks.current.length === 0) {
          console.warn('No audio chunks recorded');
          resolve(null);
          return;
        }
        
        // Explicitly set MIME type for the blob
        const audioBlob = new Blob(audioChunks.current, { 
          type: mediaRecorder.current?.mimeType || 'audio/webm;codecs=opus'
        });
        
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        
        // Validate the audio blob
        if (audioBlob.size < 100) { // Check if blob is too small
          console.warn('Audio blob is too small, might be empty');
          resolve(null);
          return;
        }
        
        if (stream.current) {
          stream.current.getTracks().forEach(track => {
            track.stop();
            console.log('Audio track stopped:', track.id);
          });
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
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          console.log('Converted audio blob to base64, length:', base64Data.length);
          resolve(base64Data);
        } catch (error) {
          console.error('Error extracting base64 data:', error);
          reject(error);
        }
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
    recordingDuration,
    startRecording,
    stopRecording,
    convertBlobToBase64
  };
}
